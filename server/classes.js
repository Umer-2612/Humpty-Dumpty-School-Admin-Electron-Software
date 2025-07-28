const db = require("./db");

// Get all divisions for a branch
function getDivisionsByBranch(branch_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name FROM divisions WHERE branch_id = ? ORDER BY name`,
      [branch_id],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
}

// Add a new division
function addDivision({ branch_id, name }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO divisions (branch_id, name) VALUES (?, ?)`,
      [branch_id, name],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, branch_id, name });
      }
    );
  });
}

// Get all classes for a branch, including their divisions
function getClassesByBranch(branch_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.id, c.name, c.fees, b.name as branch_name FROM classes c JOIN branches b ON c.branch_id = b.id WHERE c.branch_id = ? ORDER BY c.name`,
      [branch_id],
      async (err, rows) => {
        if (err) return reject(err);
        // For each class, fetch its divisions
        const result = await Promise.all(
          rows.map(async (row) => {
            let total_fees = 0;
            if (row.fees) {
              try {
                const feesObj = JSON.parse(row.fees);
                total_fees = (feesObj.term1 || 0) + (feesObj.term2 || 0);
              } catch (e) {}
            }
            // Fetch divisions for this class
            const divisions = await new Promise((res, rej) => {
              db.all(
                `SELECT name FROM divisions WHERE class_id = ? ORDER BY name`,
                [row.id],
                (e, divs) => {
                  if (e) rej(e);
                  else res(divs.map((d) => d.name));
                }
              );
            });
            return { ...row, total_fees, divisions };
          })
        );
        resolve(result);
      }
    );
  });
}

// Add a new class with divisions
function addClass({ name, branch_id, total_fees, divisions }) {
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
        // Insert divisions
        if (Array.isArray(divisions) && divisions.length > 0) {
          const stmt = db.prepare(
            `INSERT INTO divisions (class_id, name) VALUES (?, ?)`
          );
          divisions.forEach((div) => {
            if (div && div.trim()) stmt.run(class_id, div.trim());
          });
          stmt.finalize(() =>
            resolve({ id: class_id, name, branch_id, fees, divisions })
          );
        } else {
          resolve({ id: class_id, name, branch_id, fees, divisions: [] });
        }
      }
    );
  });
}

// Update a class and its divisions
function updateClass({ id, name, total_fees, divisions }) {
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
      // Update divisions
      db.run(`DELETE FROM divisions WHERE class_id = ?`, [id], (err2) => {
        if (err2) return reject(err2);
        if (Array.isArray(divisions) && divisions.length > 0) {
          const stmt = db.prepare(
            `INSERT INTO divisions (class_id, name) VALUES (?, ?)`
          );
          divisions.forEach((div) => {
            if (div && div.trim()) stmt.run(id, div.trim());
          });
          stmt.finalize(() => resolve({ id, name, divisions }));
        } else {
          resolve({ id, name, divisions: [] });
        }
      });
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
