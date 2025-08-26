// Reuse the shared SQLite connection which resolves to Electron userData
const db = require("./db");

// Compute next sequential receipt number by payment type
// type: 'cash' | 'bank' -> prefixes: 'C-' | 'B-'
const getNextReceiptNumber = (type, cb) => {
  const isCash = String(type).toLowerCase() === "cash";
  const displayPrefix = isCash ? "C-" : "B-";
  // Support both legacy (e.g., 'c1'/'b1') and new ('C-1'/'B-1') formats.
  // We sort by the numeric suffix regardless of the format using INSTR.
  const sql = `
    SELECT receipt_number AS rn
    FROM fees
    WHERE (receipt_number LIKE ? OR receipt_number LIKE ?)
    ORDER BY CAST(
      CASE 
        WHEN instr(receipt_number, '-') > 0 
          THEN substr(receipt_number, instr(receipt_number, '-') + 1)
        ELSE substr(receipt_number, 2)
      END AS INTEGER
    ) DESC
    LIMIT 1
  `;
  const params = isCash ? ["C-%", "c%"] : ["B-%", "b%"];
  db.get(sql, params, (err, row) => {
    if (err) {
      console.error("🔴 [BACKEND] Error getting next receipt number:", err);
      // fallback to 1 on error
      return cb(null, `${displayPrefix}1`);
    }
    if (!row || !row.rn) return cb(null, `${displayPrefix}1`);
    // Extract numeric part from either format safely
    const match = String(row.rn).match(/(\d+)$/);
    const lastNum = match ? parseInt(match[1], 10) : NaN;
    const next = Number.isFinite(lastNum) ? lastNum + 1 : 1;
    return cb(null, `${displayPrefix}${next}`);
  });
};

// Infer missing academic_year_id and fee_term from student's record and class fees
// Strategy:
// - academic_year_id: use provided; else student's academic_year_id; else null
// - fee_term: if provided, keep; else compute per-term pending and pick first term with pending > 0.
//   Term priority defaults to ['term1','term2','books'] but will fall back to the order of keys in class fees JSON.
const inferFeeContext = (
  studentId,
  providedYearId = null,
  providedTerm = null,
  cb = () => {}
) => {
  try {
    if (!studentId)
      return cb(null, {
        academic_year_id: providedYearId || null,
        fee_term: providedTerm || null,
      });
    const sql = `
      SELECT s.academic_year_id, c.fees as class_fees
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `;
    db.get(sql, [studentId], (err, row) => {
      if (err || !row) {
        return cb(null, {
          academic_year_id: providedYearId || null,
          fee_term: providedTerm || null,
        });
      }
      const effectiveYearId = providedYearId || row.academic_year_id || null;
      let classFees = {};
      try {
        classFees = row.class_fees ? JSON.parse(row.class_fees) : {};
      } catch (_) {
        classFees = {};
      }

      if (providedTerm) {
        return cb(null, {
          academic_year_id: effectiveYearId,
          fee_term: providedTerm,
        });
      }

      // Sum paid by term for student and effective year
      const sqlPaid = `
        SELECT fee_term as term, SUM(amount) as paid
        FROM fees
        WHERE student_id = ?
          AND (? IS NULL OR academic_year_id = ?)
        GROUP BY fee_term
      `;
      db.all(
        sqlPaid,
        [studentId, effectiveYearId ?? null, effectiveYearId ?? null],
        (sumErr, rows) => {
          if (sumErr) {
            return cb(null, {
              academic_year_id: effectiveYearId,
              fee_term: null,
            });
          }
          const paidByTerm = {};
          (rows || []).forEach((r) => {
            const key = (r.term || "").toString();
            paidByTerm[key] = Number(r.paid) || 0;
          });

          const priority = ["term1", "term2", "books"];
          const keys = Object.keys(classFees || {});
          const ordered = [...new Set([...priority, ...keys])].filter((k) =>
            keys.includes(k)
          );

          let chosen = null;
          for (const term of ordered.length ? ordered : keys) {
            const total = Number(classFees[term]) || 0;
            const paid = Number(paidByTerm[term] || 0);
            const pending = Math.max(0, total - paid);
            if (pending > 0) {
              chosen = term;
              break;
            }
          }
          if (!chosen) {
            // fallback to first available key if all settled
            chosen = ordered[0] || keys[0] || null || null;
          }
          return cb(null, {
            academic_year_id: effectiveYearId,
            fee_term: chosen,
          });
        }
      );
    });
  } catch (_) {
    return cb(null, {
      academic_year_id: providedYearId || null,
      fee_term: providedTerm || null,
    });
  }
};

// Update student's months_paid tracking when fee is collected
const updateStudentMonthsPaid = (
  studentId,
  monthYear,
  amount,
  cb = () => {}
) => {
  try {
    if (!studentId || !monthYear) return cb();

    // Get current months_paid JSON
    const sql = `SELECT months_paid FROM students WHERE id = ?`;
    db.get(sql, [studentId], (err, row) => {
      if (err) return cb();

      let monthsPaid = {};
      try {
        monthsPaid = row?.months_paid ? JSON.parse(row.months_paid) : {};
      } catch (_) {
        monthsPaid = {};
      }

      // Add or update the month entry
      monthsPaid[monthYear] = {
        amount: (monthsPaid[monthYear]?.amount || 0) + amount,
        paid_date: new Date().toISOString().split("T")[0],
        status: "paid",
      };

      // Update the database
      const updateSql = `UPDATE students SET months_paid = ? WHERE id = ?`;
      db.run(updateSql, [JSON.stringify(monthsPaid), studentId], () => cb());
    });
  } catch (_) {
    cb();
  }
};

// Remove month from student's months_paid when fee is deleted
const removeStudentMonthsPaid = (
  studentId,
  monthYear,
  amount,
  cb = () => {}
) => {
  try {
    if (!studentId || !monthYear) return cb();

    const sql = `SELECT months_paid FROM students WHERE id = ?`;
    db.get(sql, [studentId], (err, row) => {
      if (err) return cb();

      let monthsPaid = {};
      try {
        monthsPaid = row?.months_paid ? JSON.parse(row.months_paid) : {};
      } catch (_) {
        monthsPaid = {};
      }

      if (monthsPaid[monthYear]) {
        const currentAmount = monthsPaid[monthYear].amount || 0;
        const newAmount = Math.max(0, currentAmount - amount);

        if (newAmount <= 0) {
          delete monthsPaid[monthYear];
        } else {
          monthsPaid[monthYear].amount = newAmount;
        }

        const updateSql = `UPDATE students SET months_paid = ? WHERE id = ?`;
        db.run(updateSql, [JSON.stringify(monthsPaid), studentId], () => cb());
      } else {
        cb();
      }
    });
  } catch (_) {
    cb();
  }
};

// Recompute and persist student's fee_breakdown JSON on students table
// Structure: { term1: { total, paid, pending }, term2: { total, paid, pending }, books: { total, paid, pending }, totals: { total, paid, pending } }
const recomputeAndStoreStudentFeeBreakdown = (
  studentId,
  preferredAcademicYearId = null,
  cb = () => {}
) => {
  try {
    if (!studentId) return cb();
    // 1) Fetch student's class fees JSON and student's academic_year_id
    const sql = `
      SELECT s.academic_year_id, s.total_fees, s.pending_fees, c.fees as class_fees
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `;
    db.get(sql, [studentId], (err, row) => {
      if (err || !row) return cb();
      const effectiveYearId =
        preferredAcademicYearId || row.academic_year_id || null;

      let classFees = {};
      try {
        classFees = row.class_fees ? JSON.parse(row.class_fees) : {};
      } catch (_) {}

      // 2) Sum paid amounts grouped by fee_term for this student and year
      const sqlPaid = `
        SELECT fee_term as term, SUM(amount) as paid
        FROM fees
        WHERE student_id = ?
          AND (? IS NULL OR academic_year_id = ?)
        GROUP BY fee_term
      `;
      db.all(
        sqlPaid,
        [studentId, effectiveYearId ?? null, effectiveYearId ?? null],
        (sumErr, rows) => {
          if (sumErr) return cb();
          const paidByTerm = {};
          (rows || []).forEach((r) => {
            const key = (r.term || "").toString();
            paidByTerm[key] = Number(r.paid) || 0;
          });

          // 3) Build breakdown for known terms from class fees JSON
          const keys = Object.keys(classFees || {});
          const breakdown = {};
          let totalAll = 0;
          let paidAll = 0;
          keys.forEach((term) => {
            const total = Number(classFees[term]) || 0;
            const paid = Number(paidByTerm[term] || 0);
            const pending = Math.max(0, total - paid);
            breakdown[term] = { total, paid, pending };
            totalAll += total;
            paidAll += paid;
          });
          breakdown.totals = {
            total: totalAll,
            paid: paidAll,
            pending: Math.max(0, totalAll - paidAll),
          };

          // 4) Store JSON on students.fee_breakdown (do not change totals/pending here)
          const updSql = `UPDATE students SET fee_breakdown = ? WHERE id = ?`;
          db.run(updSql, [JSON.stringify(breakdown), studentId], () => cb());
        }
      );
    });
  } catch (_) {
    cb();
  }
};

// Get per-term totals/paid/pending for a student using class.fees JSON and fees records
const getStudentTermSummary = (studentId, academicYearId, callback) => {
  try {
    // 1) Fetch student's class_id and class fee structure from individual columns
    const sqlStudent = `
      SELECT s.class_id, c.term1_fee, c.term2_fee, c.books_charge
      FROM students s
      JOIN classes c ON s.class_id = c.id
      WHERE s.id = ?
    `;
    db.get(sqlStudent, [studentId], (err, row) => {
      if (err) {
        console.error(
          "🔴 [BACKEND] getStudentTermSummary: student lookup failed",
          err
        );
        return callback(err);
      }
      if (!row) return callback(null, { terms: {} });

      // Build class fees structure from individual columns
      const classFees = {
        term1: Number(row.term1_fee) || 0,
        term2: Number(row.term2_fee) || 0,
        books: Number(row.books_charge) || 0,
      };

      // 2) Sum paid amounts grouped by fee_term for this student and year
      const sqlPaid = `
        SELECT fee_term as term, SUM(amount) as paid
        FROM fees
        WHERE student_id = ?
          AND (? IS NULL OR academic_year_id = ?)
        GROUP BY fee_term
      `;
      db.all(
        sqlPaid,
        [studentId, academicYearId ?? null, academicYearId ?? null],
        (sumErr, rows) => {
          if (sumErr) {
            console.error(
              "🔴 [BACKEND] getStudentTermSummary: paid sum failed",
              sumErr
            );
            return callback(sumErr);
          }
          const paidByTerm = {};
          (rows || []).forEach((r) => {
            const key = (r.term || "").toString();
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
        }
      );
    });
  } catch (e) {
    console.error("🔴 [BACKEND] getStudentTermSummary exception", e);
    return callback(e);
  }
};

// Get all fees records with student and branch details (optionally by academic year)
const getFees = (branchId, academicYearId, callback) => {
  console.log(
    "🟡 [BACKEND] Getting fees for branch:",
    branchId,
    "year:",
    academicYearId
  );

  const query = `
    SELECT 
      f.*,
      s.name as student_name,
      s.roll_number,
      s.division,
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

  db.all(
    query,
    [branchId, academicYearId ?? null, academicYearId ?? null],
    (err, rows) => {
      if (err) {
        console.error("🔴 [BACKEND] Error fetching fees:", err);
        callback(err, null);
      } else {
        console.log("🟢 [BACKEND] Fees fetched successfully:", rows.length);
        callback(null, rows);
      }
    }
  );
};

// Add new fees record
const addFees = (feesData, callback) => {
  console.log("🟡 [BACKEND] Adding fees:", feesData);

  // Normalize payment_type to 'cash' or 'bank'
  const normalizedType = feesData.payment_type === "cash" ? "cash" : "bank";

  // Generate next receipt number for the type, then insert
  getNextReceiptNumber(normalizedType, (genErr, receiptNumber) => {
    if (genErr) {
      console.error("🔴 [BACKEND] Failed to generate receipt number:", genErr);
      return callback(genErr, null);
    }
    // Infer missing academic_year_id and fee_term before insert
    inferFeeContext(
      feesData.student_id,
      feesData.academic_year_id || null,
      feesData.fee_term || null,
      (_e, inferred) => {
        const academicYearToUse = inferred?.academic_year_id ?? null;
        const feeTermToUse = inferred?.fee_term ?? null;

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
          academicYearToUse,
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
          feeTermToUse,
          feesData.fee_charge || null,
        ];

        db.run(query, params, function (err) {
          if (err) {
            console.error("🔴 [BACKEND] Error adding fees:", err);
            callback(err, null);
          } else {
            console.log(
              "🟢 [BACKEND] Fees added successfully with ID:",
              this.lastID
            );
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
                  console.error(
                    "🔴 [BACKEND] Error updating student's pending_fees:",
                    updErr
                  );
                  // We still return success for the fee insert, but log the error
                } else {
                  console.log(
                    "🟢 [BACKEND] Student pending_fees updated for student_id:",
                    feesData.student_id
                  );
                }
                // Update months_paid tracking and recompute fee_breakdown
                updateStudentMonthsPaid(
                  feesData.student_id,
                  feesData.month_year,
                  Number(feesData.amount) || 0,
                  () => {
                    recomputeAndStoreStudentFeeBreakdown(
                      feesData.student_id,
                      academicYearToUse,
                      () => {
                        callback(null, {
                          id: this?.lastID || null,
                          receipt_number: receiptNumber,
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        });
      }
    );
  });
};

// Update fees record and adjust student's pending_fees by delta (new - old)
const updateFees = (id, feesData, callback) => {
  console.log("🟡 [BACKEND] Updating fees:", id, feesData);
  const normalizedType = feesData.payment_type === "cash" ? "cash" : "bank";

  // First get the previous amount and student_id
  db.get(
    "SELECT amount, student_id FROM fees WHERE id = ?",
    [id],
    (selErr, prev) => {
      if (selErr) {
        console.error(
          "🔴 [BACKEND] Error reading existing fee for update:",
          selErr
        );
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

      // Infer missing academic_year_id / fee_term before update
      inferFeeContext(
        targetStudentId,
        feesData.academic_year_id || null,
        feesData.fee_term || null,
        (_e, inferred) => {
          const academicYearToUse = inferred?.academic_year_id ?? null;
          const feeTermToUse = inferred?.fee_term ?? null;

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
            academicYearToUse,
            feeTermToUse,
            feesData.fee_charge || null,
            id,
          ];
          db.run(query, params, function (updErr) {
            if (updErr) {
              console.error("🔴 [BACKEND] Error updating fees:", updErr);
              return callback(updErr, null);
            }
            console.log(
              "🟢 [BACKEND] Fees updated successfully, adjusting student's pending_fees"
            );

            if (targetStudentId !== prevStudentId) {
              // Case: fee moved to different student
              // 1) Add back previous amount to previous student's pending_fees
              const addBackSql = `
              UPDATE students
              SET pending_fees = COALESCE(pending_fees, COALESCE(total_fees, 0)) + ?
              WHERE id = ?
            `;
              db.run(
                addBackSql,
                [prevAmount, prevStudentId],
                function (adjErr1) {
                  if (adjErr1) {
                    console.error(
                      "🔴 [BACKEND] Error restoring pending_fees to previous student:",
                      adjErr1
                    );
                    // continue to adjust new student regardless
                  }
                  // 2) Subtract new amount from new student's pending_fees
                  const subtractSql = `
                UPDATE students
                SET pending_fees = MAX(0, COALESCE(pending_fees, COALESCE(total_fees, 0)) - ?)
                WHERE id = ?
              `;
                  db.run(
                    subtractSql,
                    [newAmount, targetStudentId],
                    function (adjErr2) {
                      if (adjErr2) {
                        console.error(
                          "🔴 [BACKEND] Error reducing pending_fees for new student:",
                          adjErr2
                        );
                        return callback(null, {
                          changes: 1,
                          pending_adjust_error: true,
                        });
                      }
                      console.log(
                        "🟢 [BACKEND] Pending fees adjusted for student change. prev:",
                        prevStudentId,
                        "new:",
                        targetStudentId
                      );
                      // Recompute breakdown for both students
                      recomputeAndStoreStudentFeeBreakdown(
                        prevStudentId,
                        academicYearToUse,
                        () => {
                          recomputeAndStoreStudentFeeBreakdown(
                            targetStudentId,
                            academicYearToUse,
                            () => {
                              return callback(null, { changes: 1 });
                            }
                          );
                        }
                      );
                    }
                  );
                }
              );
            } else {
              // Same student: subtract delta (negative delta increases pending)
              const adjSql = `
              UPDATE students
              SET pending_fees = MAX(0, COALESCE(pending_fees, COALESCE(total_fees, 0)) - ?)
              WHERE id = ?
            `;
              db.run(adjSql, [delta, targetStudentId], function (adjErr) {
                if (adjErr) {
                  console.error(
                    "🔴 [BACKEND] Error adjusting student's pending_fees on update:",
                    adjErr
                  );
                  // Still return success for the fee update
                  // Still recompute breakdown even if pending adjust failed
                  recomputeAndStoreStudentFeeBreakdown(
                    targetStudentId,
                    academicYearToUse,
                    () => {
                      return callback(null, {
                        changes: 1,
                        pending_adjust_error: true,
                      });
                    }
                  );
                }
                console.log(
                  "🟢 [BACKEND] Student pending_fees adjusted for student_id:",
                  targetStudentId
                );
                // Update months_paid tracking for the new amount/month
                updateStudentMonthsPaid(
                  targetStudentId,
                  feesData.month_year,
                  newAmount,
                  () => {
                    recomputeAndStoreStudentFeeBreakdown(
                      targetStudentId,
                      academicYearToUse,
                      () => {
                        return callback(null, { changes: 1 });
                      }
                    );
                  }
                );
              });
            }
          });
        }
      );
    }
  );
};

// Delete fees record and increase student's pending_fees by deleted amount
const deleteFees = (id, callback) => {
  console.log("🟡 [BACKEND] Deleting fees:", id);

  // Fetch amount and student_id first
  db.get(
    "SELECT amount, student_id FROM fees WHERE id = ?",
    [id],
    (selErr, row) => {
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
        console.log(
          "🟢 [BACKEND] Fees deleted successfully, increasing student's pending_fees by:",
          amount
        );

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
            console.error(
              "🔴 [BACKEND] Error adjusting student's pending_fees on delete:",
              adjErr
            );
            // Still return success for the fee deletion
            // Still attempt to recompute fee_breakdown
            recomputeAndStoreStudentFeeBreakdown(studentId, null, () => {
              return callback(null, { changes: 1, pending_adjust_error: true });
            });
          }
          console.log(
            "🟢 [BACKEND] Student pending_fees increased for student_id:",
            studentId
          );
          // Get the month_year from the deleted fee record to update months_paid
          db.get(
            "SELECT month_year FROM fees WHERE id = ?",
            [id],
            (monthErr, monthRow) => {
              const monthYear = monthRow?.month_year;
              if (monthYear) {
                removeStudentMonthsPaid(studentId, monthYear, amount, () => {
                  recomputeAndStoreStudentFeeBreakdown(studentId, null, () => {
                    return callback(null, { changes: 1 });
                  });
                });
              } else {
                recomputeAndStoreStudentFeeBreakdown(studentId, null, () => {
                  return callback(null, { changes: 1 });
                });
              }
            }
          );
        });
      });
    }
  );
};

// Get students for dropdown (branch-wise, optionally by academic year)
const getStudentsForFees = (branchId, academicYearId, callback) => {
  console.log(
    "🟡 [BACKEND] Getting students for fees dropdown, branch:",
    branchId,
    "year:",
    academicYearId
  );

  const query = `
    SELECT 
      s.id,
      s.name,
      s.roll_number,
      c.name as class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.branch_id = ?
      AND (? = 'all' OR ? IS NULL OR s.academic_year_id = ?)
    ORDER BY c.name, s.roll_number
  `;

  db.all(
    query,
    [branchId, academicYearId ?? null, academicYearId ?? null, academicYearId ?? null],
    (err, rows) => {
      if (err) {
        console.error("🔴 [BACKEND] Error fetching students for fees:", err);
        callback(err, null);
      } else {
        console.log(
          "🟢 [BACKEND] Students for fees fetched successfully:",
          rows.length
        );
        callback(null, rows);
      }
    }
  );
};

// Get fees receipt details
const getFeesReceipt = (receiptNumber, callback) => {
  console.log("🟡 [BACKEND] Getting receipt details:", receiptNumber);

  const query = `
    SELECT 
      f.*,
      s.name as student_name,
      s.roll_number,
      s.division,
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

// Get student's month-wise payment status
const getStudentMonthsStatus = (studentId, callback) => {
  try {
    const sql = `SELECT months_paid FROM students WHERE id = ?`;
    db.get(sql, [studentId], (err, row) => {
      if (err) {
        console.error("🔴 [BACKEND] Error getting student months status:", err);
        return callback(err);
      }

      let monthsPaid = {};
      try {
        monthsPaid = row?.months_paid ? JSON.parse(row.months_paid) : {};
      } catch (e) {
        monthsPaid = {};
      }

      // Generate status for all 12 months
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      const monthsStatus = {};
      months.forEach((month) => {
        monthsStatus[month] = {
          paid: !!monthsPaid[month],
          amount: monthsPaid[month]?.amount || 0,
          paid_date: monthsPaid[month]?.paid_date || null,
          status: monthsPaid[month]?.status || "pending",
        };
      });

      callback(null, { monthsStatus, monthsPaid });
    });
  } catch (e) {
    console.error("🔴 [BACKEND] getStudentMonthsStatus exception:", e);
    callback(e);
  }
};

module.exports = {
  getFees,
  addFees,
  updateFees,
  deleteFees,
  getStudentsForFees,
  getFeesReceipt,
  getNextReceiptNumber,
  getStudentTermSummary,
  getStudentMonthsStatus,
  updateStudentMonthsPaid,
  removeStudentMonthsPaid,
};
