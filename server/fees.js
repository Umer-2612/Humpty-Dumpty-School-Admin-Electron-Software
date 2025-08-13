const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "school.db");
const db = new sqlite3.Database(dbPath);

// Generate unique receipt number
const generateReceiptNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REC${timestamp}${random}`;
};

// Get all fees records with student and branch details
const getFees = (branchId, callback) => {
  console.log("🟡 [BACKEND] Getting fees for branch:", branchId);
  
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
    ORDER BY f.created_at DESC
  `;
  
  db.all(query, [branchId], (err, rows) => {
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
  
  // Generate unique receipt number
  const receiptNumber = generateReceiptNumber();
  
  const query = `
    INSERT INTO fees (
      student_id, branch_id, amount, payment_type, cheque_number, 
      bank_name, payee_name, receipt_number, payment_date, 
      academic_year, month_year, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    feesData.student_id,
    feesData.branch_id,
    feesData.amount,
    feesData.payment_type,
    feesData.cheque_number || null,
    feesData.bank_name || null,
    feesData.payee_name,
    receiptNumber,
    feesData.payment_date,
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
};

// Update fees record
const updateFees = (id, feesData, callback) => {
  console.log("🟡 [BACKEND] Updating fees:", id, feesData);
  
  const query = `
    UPDATE fees SET 
      student_id = ?, amount = ?, payment_type = ?, cheque_number = ?, 
      bank_name = ?, payee_name = ?, payment_date = ?, 
      academic_year = ?, month_year = ?, notes = ?
    WHERE id = ?
  `;
  
  const params = [
    feesData.student_id,
    feesData.amount,
    feesData.payment_type,
    feesData.cheque_number || null,
    feesData.bank_name || null,
    feesData.payee_name,
    feesData.payment_date,
    feesData.academic_year || null,
    feesData.month_year || null,
    feesData.notes || null,
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

// Get students for dropdown (branch-wise)
const getStudentsForFees = (branchId, callback) => {
  console.log("🟡 [BACKEND] Getting students for fees dropdown, branch:", branchId);
  
  const query = `
    SELECT 
      s.id,
      s.name,
      s.roll_number,
      c.name as class_name
    FROM students s
    JOIN classes c ON s.class_id = c.id
    WHERE c.branch_id = ?
    ORDER BY c.name, s.roll_number
  `;
  
  db.all(query, [branchId], (err, rows) => {
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
  getFeesReceipt
};
