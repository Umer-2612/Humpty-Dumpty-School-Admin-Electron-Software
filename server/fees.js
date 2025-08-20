// Reuse the shared SQLite connection which resolves to Electron userData
const db = require("./db");

// Compute next sequential receipt number by payment type
// type: 'cash' | 'bank' -> prefixes: 'c' | 'b'
const getNextReceiptNumber = (type, cb) => {
  const prefix = type === 'cash' ? 'c' : 'b';
  const sql = `
    SELECT receipt_number AS rn
    FROM fees
    WHERE receipt_number LIKE ?
    ORDER BY CAST(substr(receipt_number, 2) AS INTEGER) DESC
    LIMIT 1
  `;
  db.get(sql, [`${prefix}%`], (err, row) => {
    if (err) {
      console.error("🔴 [BACKEND] Error getting next receipt number:", err);
      // fallback to 1 on error
      return cb(null, `${prefix}1`);
    }
    if (!row || !row.rn) return cb(null, `${prefix}1`);
    const lastNum = parseInt(String(row.rn).slice(1), 10);
    const next = Number.isFinite(lastNum) ? lastNum + 1 : 1;
    return cb(null, `${prefix}${next}`);
  });
};

// Get per-term totals/paid/pending for a student using class.fees JSON and fees records
const getStudentTermSummary = (studentId, academicYearId, callback) => {
  try {
    // 1) Fetch student's class_id and class fees JSON
    const sqlStudent = `
      SELECT s.class_id, c.fees as class_fees
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `;
    db.get(sqlStudent, [studentId], (err, row) => {
      if (err) {
        console.error("🔴 [BACKEND] getStudentTermSummary: student lookup failed", err);
        return callback(err);
      }
      if (!row) return callback(null, { terms: {} });

      let classFees = {};
      try {
        classFees = row.class_fees ? JSON.parse(row.class_fees) : {};
      } catch (e) {
        classFees = {};
      }

      // 2) Sum paid amounts grouped by fee_term for this student and year
      const sqlPaid = `
        SELECT fee_term as term, SUM(amount) as paid
        FROM fees
        WHERE student_id = ?
          AND (? IS NULL OR academic_year_id = ?)
        GROUP BY fee_term
      `;
      db.all(sqlPaid, [studentId, academicYearId ?? null, academicYearId ?? null], (sumErr, rows) => {
        if (sumErr) {
          console.error("🔴 [BACKEND] getStudentTermSummary: paid sum failed", sumErr);
          return callback(sumErr);
        }
        const paidByTerm = {};
        (rows || []).forEach((r) => {
          const key = (r.term || '').toString();
          paidByTerm[key] = Number(r.paid) || 0;
        });

        // 3) Build summary for known terms from class fees JSON
        const terms = {};
        Object.keys(classFees || {}).forEach((term) => {
          const total = Number(classFees[term]) || 0;
          const paid = Number(paidByTerm[term] || 0);
          const pending = Math.max(0, total - paid);
          terms[term] = { total, paid, pending };
        });

        return callback(null, { terms });
      });
    });
  } catch (e) {
    console.error("🔴 [BACKEND] getStudentTermSummary exception", e);
    return callback(e);
  }
};

// Get all fees records with student and branch details (optionally by academic year)
const getFees = (branchId, academicYearId, callback) => {
  console.log("🟡 [BACKEND] Getting fees for branch:", branchId, "year:", academicYearId);
  
  const query = `
    SELECT 
      f.*,
      s.name as student_name,
      s.roll_number,
      c.name as class_name,
      b.name as branch_name
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN branches b ON f.branch_id = b.id
    WHERE f.branch_id = ?
      AND (? IS NULL OR f.academic_year_id = ?)
    ORDER BY f.created_at DESC
  `;
  
  db.all(query, [branchId, academicYearId ?? null, academicYearId ?? null], (err, rows) => {
    if (err) {
      console.error("🔴 [BACKEND] Error fetching fees:", err);
      callback(err, null);
    } else {
      console.log("🟢 [BACKEND] Fees fetched successfully:", rows.length);
      callback(null, rows);
    }
  });
};

// Add new fees record
const addFees = (feesData, callback) => {
  console.log("🟡 [BACKEND] Adding fees:", feesData);
  
  // Normalize payment_type to 'cash' or 'bank'
  const normalizedType = feesData.payment_type === 'cash' ? 'cash' : 'bank';

  // Generate next receipt number for the type, then insert
  getNextReceiptNumber(normalizedType, (genErr, receiptNumber) => {
    if (genErr) {
      console.error("🔴 [BACKEND] Failed to generate receipt number:", genErr);
      return callback(genErr, null);
    }

    const query = `
      INSERT INTO fees (
        student_id, branch_id, academic_year_id, amount, payment_type, cheque_number,
        bank_name, payee_name, receipt_number, payment_date, cheque_date,
        academic_year, month_year, notes, fee_term, fee_charge
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      feesData.student_id,
      feesData.branch_id,
      feesData.academic_year_id || null,
      feesData.amount,
      normalizedType,
      feesData.cheque_number || null,
      feesData.bank_name || null,
      feesData.payee_name || null,
      receiptNumber,
      feesData.payment_date,
      feesData.cheque_date || null,
      feesData.academic_year || null,
      feesData.month_year || null,
      feesData.notes || null,
      feesData.fee_term || null,
      feesData.fee_charge || null
    ];

    db.run(query, params, function(err) {
      if (err) {
        console.error("🔴 [BACKEND] Error adding fees:", err);
        callback(err, null);
      } else {
        console.log("🟢 [BACKEND] Fees added successfully with ID:", this.lastID);
        // Update student's pending_fees: subtract amount, clamp at 0
        const updatePendingSql = `
          UPDATE students
          SET pending_fees = MAX(0, COALESCE(pending_fees, COALESCE(total_fees, 0)) - ?)
          WHERE id = ?
        `;
        db.run(
          updatePendingSql,
          [Number(feesData.amount) || 0, feesData.student_id],
          function (updErr) {
            if (updErr) {
              console.error("🔴 [BACKEND] Error updating student's pending_fees:", updErr);
              // We still return success for the fee insert, but log the error
            } else {
              console.log("🟢 [BACKEND] Student pending_fees updated for student_id:", feesData.student_id);
            }
            callback(null, { id: this?.lastID || null, receipt_number: receiptNumber });
          }
        );
      }
    });
  });
};

// Update fees record and adjust student's pending_fees by delta (new - old)
const updateFees = (id, feesData, callback) => {
  console.log("🟡 [BACKEND] Updating fees:", id, feesData);
  const normalizedType = feesData.payment_type === 'cash' ? 'cash' : 'bank';

  // First get the previous amount and student_id
  db.get("SELECT amount, student_id FROM fees WHERE id = ?", [id], (selErr, prev) => {
    if (selErr) {
      console.error("🔴 [BACKEND] Error reading existing fee for update:", selErr);
      return callback(selErr, null);
    }
    if (!prev) {
      console.warn("🟠 [BACKEND] No existing fee found for id:", id);
      return callback(null, { changes: 0 });
    }

    const prevAmount = Number(prev.amount) || 0;
    const newAmount = Number(feesData.amount) || 0;
    const delta = newAmount - prevAmount; // if negative, we will add back to pending
    const prevStudentId = prev.student_id;
    const targetStudentId = feesData.student_id || prevStudentId;

    const query = `
      UPDATE fees SET 
        student_id = ?, amount = ?, payment_type = ?, cheque_number = ?, 
        bank_name = ?, payee_name = ?, payment_date = ?, cheque_date = ?,
        academic_year = ?, month_year = ?, notes = ?, academic_year_id = ?,
        fee_term = ?, fee_charge = ?
      WHERE id = ?
    `;
    const params = [
      targetStudentId,
      newAmount,
      normalizedType,
      feesData.cheque_number || null,
      feesData.bank_name || null,
      feesData.payee_name || null,
      feesData.payment_date,
      feesData.cheque_date || null,
      feesData.academic_year || null,
      feesData.month_year || null,
      feesData.notes || null,
      feesData.academic_year_id || null,
      feesData.fee_term || null,
      feesData.fee_charge || null,
      id
    ];

    db.run(query, params, function (updErr) {
      if (updErr) {
        console.error("🔴 [BACKEND] Error updating fees:", updErr);
        return callback(updErr, null);
      }
      console.log("🟢 [BACKEND] Fees updated successfully, adjusting student's pending_fees");

      if (targetStudentId !== prevStudentId) {
        // Case: fee moved to different student
        // 1) Add back previous amount to previous student's pending_fees
        const addBackSql = `
          UPDATE students
          SET pending_fees = COALESCE(pending_fees, COALESCE(total_fees, 0)) + ?
          WHERE id = ?
        `;
        db.run(addBackSql, [prevAmount, prevStudentId], function (adjErr1) {
          if (adjErr1) {
            console.error("🔴 [BACKEND] Error restoring pending_fees to previous student:", adjErr1);
            // continue to adjust new student regardless
          }
          // 2) Subtract new amount from new student's pending_fees
          const subtractSql = `
            UPDATE students
            SET pending_fees = MAX(0, COALESCE(pending_fees, COALESCE(total_fees, 0)) - ?)
            WHERE id = ?
          `;
          db.run(subtractSql, [newAmount, targetStudentId], function (adjErr2) {
            if (adjErr2) {
              console.error("🔴 [BACKEND] Error reducing pending_fees for new student:", adjErr2);
              return callback(null, { changes: 1, pending_adjust_error: true });
            }
            console.log("🟢 [BACKEND] Pending fees adjusted for student change. prev:", prevStudentId, "new:", targetStudentId);
            return callback(null, { changes: 1 });
          });
        });
      } else {
        // Same student: subtract delta (negative delta increases pending)
        const adjSql = `
          UPDATE students
          SET pending_fees = MAX(0, COALESCE(pending_fees, COALESCE(total_fees, 0)) - ?)
          WHERE id = ?
        `;
        db.run(adjSql, [delta, targetStudentId], function (adjErr) {
          if (adjErr) {
            console.error("🔴 [BACKEND] Error adjusting student's pending_fees on update:", adjErr);
            // Still return success for the fee update
            return callback(null, { changes: 1, pending_adjust_error: true });
          }
          console.log("🟢 [BACKEND] Student pending_fees adjusted for student_id:", targetStudentId);
          return callback(null, { changes: 1 });
        });
      }
    });
  });
};

// Delete fees record and increase student's pending_fees by deleted amount
const deleteFees = (id, callback) => {
  console.log("🟡 [BACKEND] Deleting fees:", id);

  // Fetch amount and student_id first
  db.get("SELECT amount, student_id FROM fees WHERE id = ?", [id], (selErr, row) => {
    if (selErr) {
      console.error("🔴 [BACKEND] Error reading fee for delete:", selErr);
      return callback(selErr, null);
    }
    const amount = Number(row?.amount) || 0;
    const studentId = row?.student_id;

    db.run("DELETE FROM fees WHERE id = ?", [id], function (delErr) {
      if (delErr) {
        console.error("🔴 [BACKEND] Error deleting fees:", delErr);
        return callback(delErr, null);
      }
      console.log("🟢 [BACKEND] Fees deleted successfully, increasing student's pending_fees by:", amount);

      if (!studentId || !amount) {
        return callback(null, { changes: this.changes });
      }

      const adjSql = `
        UPDATE students
        SET pending_fees = COALESCE(pending_fees, COALESCE(total_fees, 0)) + ?
        WHERE id = ?
      `;
      db.run(adjSql, [amount, studentId], function (adjErr) {
        if (adjErr) {
          console.error("🔴 [BACKEND] Error adjusting student's pending_fees on delete:", adjErr);
          // Still return success for the fee deletion
          return callback(null, { changes: 1, pending_adjust_error: true });
        }
        console.log("🟢 [BACKEND] Student pending_fees increased for student_id:", studentId);
        return callback(null, { changes: 1 });
      });
    });
  });
};

// Get students for dropdown (branch-wise, optionally by academic year)
const getStudentsForFees = (branchId, academicYearId, callback) => {
  console.log("🟡 [BACKEND] Getting students for fees dropdown, branch:", branchId, "year:", academicYearId);
  
  const query = `
    SELECT 
      s.id,
      s.name,
      s.roll_number,
      c.name as class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.branch_id = ?
      AND (? IS NULL OR s.academic_year_id = ?)
    ORDER BY c.name, s.roll_number
  `;
  
  db.all(query, [branchId, academicYearId ?? null, academicYearId ?? null], (err, rows) => {
    if (err) {
      console.error("🔴 [BACKEND] Error fetching students for fees:", err);
      callback(err, null);
    } else {
      console.log("🟢 [BACKEND] Students for fees fetched successfully:", rows.length);
      callback(null, rows);
    }
  });
};

// Get fees receipt details
const getFeesReceipt = (receiptNumber, callback) => {
  console.log("🟡 [BACKEND] Getting receipt details:", receiptNumber);
  
  const query = `
    SELECT 
      f.*,
      s.name as student_name,
      s.roll_number,
      c.name as class_name,
      b.name as branch_name
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN branches b ON f.branch_id = b.id
    WHERE f.receipt_number = ?
  `;
  
  db.get(query, [receiptNumber], (err, row) => {
    if (err) {
      console.error("🔴 [BACKEND] Error fetching receipt:", err);
      callback(err, null);
    } else {
      console.log("🟢 [BACKEND] Receipt fetched successfully");
      callback(null, row);
    }
  });
};

module.exports = {
  getFees,
  addFees,
  updateFees,
  deleteFees,
  getStudentsForFees,
  getFeesReceipt,
  getNextReceiptNumber,
  getStudentTermSummary
};
