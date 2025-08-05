const db = require("./db");

// Get all classes for a branch
function getClassesByBranch(branch_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.id, c.name, c.fees, b.name as branch_name FROM classes c JOIN branches b ON c.branch_id = b.id WHERE c.branch_id = ? ORDER BY c.name`,
      [branch_id],
      (err, rows) => {
        if (err) return reject(err);
        // Calculate total fees for each class
        const result = rows.map((row) => {
          let total_fees = 0;
          if (row.fees) {
            try {
              const feesObj = JSON.parse(row.fees);
              total_fees = (feesObj.term1 || 0) + (feesObj.term2 || 0);
            } catch (e) {}
          }
          return { ...row, total_fees };
        });
        resolve(result);
      }
    );
  });
}

// Add a new class
function addClass({ name, branch_id, total_fees }) {
  return new Promise((resolve, reject) => {
    const term1 = Math.round((total_fees || 0) / 2);
    const term2 = (total_fees || 0) - term1;
    const fees = JSON.stringify({ term1, term2 });
    db.run(
      `INSERT INTO classes (name, branch_id, fees) VALUES (?, ?, ?)`,
      [name, branch_id, fees],
      function (err) {
        if (err) return reject(err);
        const class_id = this.lastID;
        resolve({ id: class_id, name, branch_id, fees });
      }
    );
  });
}

// Update a class
function updateClass({ id, name, total_fees }) {
  return new Promise((resolve, reject) => {
    let updateFields = [name];
    let sql = `UPDATE classes SET name = ?`;
    if (typeof total_fees !== "undefined") {
      const term1 = Math.round((total_fees || 0) / 2);
      const term2 = (total_fees || 0) - term1;
      const fees = JSON.stringify({ term1, term2 });
      sql += `, fees = ?`;
      updateFields.push(fees);
    }
    sql += ` WHERE id = ?`;
    updateFields.push(id);
    db.run(sql, updateFields, function (err) {
      if (err) return reject(err);
      resolve({ id, name });
    });
  });
}

// Delete a class
function deleteClass(id) {
  console.log("server/classes.js] deleteClass() called with id:", id);
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM classes WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error("server/classes.js] Error deleting class:", err);
        reject(err);
      } else {
        resolve({ id });
      }
    });
  });
}

module.exports = { getClassesByBranch, addClass, updateClass, deleteClass };
