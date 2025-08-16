const db = require("./db");

// Get all class shifts
function getClassShifts() {
  console.log("server/class_shifts.js] getClassShifts() called");
  // take in variable and then return
  const data = new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, start_time, end_time FROM class_shifts ORDER BY name`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
  console.log("here: ", data);
  return data;
}

// Add a new class shift
function addClassShift({ name, start_time, end_time }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO class_shifts (name, start_time, end_time) VALUES (?, ?, ?)`,
      [name, start_time, end_time],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, start_time, end_time });
      }
    );
  });
}

// Update a class shift
function updateClassShift({ id, name, start_time, end_time }) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE class_shifts SET name = ?, start_time = ?, end_time = ? WHERE id = ?`,
      [name, start_time, end_time, id],
      function (err) {
        if (err) reject(err);
        else resolve({ id, name, start_time, end_time });
      }
    );
  });
}

// Delete a class shift
function deleteClassShift(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM class_shifts WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve({ id });
    });
  });
}

module.exports = {
  getClassShifts,
  addClassShift,
  updateClassShift,
  deleteClassShift,
};
