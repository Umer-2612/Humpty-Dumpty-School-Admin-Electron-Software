const db = require("./db");

// Get all classes for a branch
function getClassesByBranch(branch_id) {
  console.log(
    "[server/classes.js] getClassesByBranch() called with branch_id:",
    branch_id
  );
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.id, c.name, b.name as branch_name FROM classes c JOIN branches b ON c.branch_id = b.id WHERE c.branch_id = ? ORDER BY c.name`,
      [branch_id],
      (err, rows) => {
        if (err) {
          console.error("[server/classes.js] Error fetching classes:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Add a new class
function addClass({ name, branch_id }) {
  console.log("[server/classes.js] addClass() called with:", name, branch_id);
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO classes (name, branch_id) VALUES (?, ?)`,
      [name, branch_id],
      function (err) {
        if (err) {
          console.error("[server/classes.js] Error adding class:", err);
          reject(err);
        } else {
          resolve({ id: this.lastID, name, branch_id });
        }
      }
    );
  });
}

// Update a class
function updateClass({ id, name }) {
  console.log("server/classes.js] updateClass() called with:", id, name);
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE classes SET name = ? WHERE id = ?`,
      [name, id],
      function (err) {
        if (err) {
          console.error("server/classes.js] Error updating class:", err);
          reject(err);
        } else {
          resolve({ id, name });
        }
      }
    );
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
