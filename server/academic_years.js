const db = require("./db");

function listAcademicYears() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, start_date, end_date, is_active, created_at FROM academic_years ORDER BY start_date DESC`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

function addAcademicYear({ name, start_date, end_date, is_active = 0 }) {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!name || !start_date || !end_date) {
      return reject(new Error("name, start_date, end_date are required"));
    }
    db.run(
      `INSERT INTO academic_years (name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)`
      , [name, start_date, end_date, is_active ? 1 : 0]
      , function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, start_date, end_date, is_active: is_active ? 1 : 0 });
      }
    );
  });
}

function updateAcademicYear({ id, name, start_date, end_date, is_active }) {
  return new Promise((resolve, reject) => {
    if (!id) return reject(new Error("id is required"));
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push("name = ?"); params.push(name); }
    if (start_date !== undefined) { fields.push("start_date = ?"); params.push(start_date); }
    if (end_date !== undefined) { fields.push("end_date = ?"); params.push(end_date); }
    if (is_active !== undefined) { fields.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (!fields.length) return resolve({ changes: 0 });
    params.push(id);
    const sql = `UPDATE academic_years SET ${fields.join(", ")} WHERE id = ?`;
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ changes: this.changes });
    });
  });
}

function setActiveAcademicYear(id) {
  return new Promise((resolve, reject) => {
    if (!id) return reject(new Error("id is required"));
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run(`UPDATE academic_years SET is_active = 0`);
      db.run(`UPDATE academic_years SET is_active = 1 WHERE id = ?`, [id]);
      db.run("COMMIT", (err) => {
        if (err) return reject(err);
        resolve({ success: true });
      });
    });
  });
}

function getActiveAcademicYear() {
  return new Promise((resolve, reject) => {
    db.get(`SELECT id, name, start_date, end_date, is_active FROM academic_years WHERE is_active = 1 LIMIT 1`, [], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

module.exports = {
  listAcademicYears,
  addAcademicYear,
  updateAcademicYear,
  setActiveAcademicYear,
  getActiveAcademicYear,
};
