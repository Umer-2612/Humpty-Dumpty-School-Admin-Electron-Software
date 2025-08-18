const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "school.db");
const db = new sqlite3.Database(dbPath);

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
        academic_year, month_year, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      feesData.notes || null
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

// Update fees record
const updateFees = (id, feesData, callback) => {
  console.log("🟡 [BACKEND] Updating fees:", id, feesData);
  const normalizedType = feesData.payment_type === 'cash' ? 'cash' : 'bank';
  
  const query = `
    UPDATE fees SET 
      student_id = ?, amount = ?, payment_type = ?, cheque_number = ?, 
      bank_name = ?, payee_name = ?, payment_date = ?, cheque_date = ?,
      academic_year = ?, month_year = ?, notes = ?, academic_year_id = ?
    WHERE id = ?
  `;
  
  const params = [
    feesData.student_id,
    feesData.amount,
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
    id
  ];
  
  db.run(query, params, function(err) {
    if (err) {
      console.error("🔴 [BACKEND] Error updating fees:", err);
      callback(err, null);
    } else {
      console.log("🟢 [BACKEND] Fees updated successfully");
      callback(null, { changes: this.changes });
    }
  });
};

// Delete fees record
const deleteFees = (id, callback) => {
  console.log("🟡 [BACKEND] Deleting fees:", id);
  
  db.run("DELETE FROM fees WHERE id = ?", [id], function(err) {
    if (err) {
      console.error("🔴 [BACKEND] Error deleting fees:", err);
      callback(err, null);
    } else {
      console.log("🟢 [BACKEND] Fees deleted successfully");
      callback(null, { changes: this.changes });
    }
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
  getNextReceiptNumber
};
