const db = require("./db");

// Helpers to parse/format fees JSON
function parseFees(fees) {
  try {
    const obj = typeof fees === "string" ? JSON.parse(fees) : fees || {};
    return {
      term1: Number(obj.term1) || 0,
      term2: Number(obj.term2) || 0,
      books: Number(obj.books ?? obj.books_charge) || 0,
    };
  } catch (_) {
    return { term1: 0, term2: 0, books: 0 };
  }
}

function toRow(r) {
  const { term1, term2, books } = parseFees(r.fees);
  return {
    id: r.id,
    branch_id: r.branch_id,
    class_id: r.class_id || null,
    shift_id: r.shift_id || null,
    class_name: r.class_name,
    shift_name: r.shift_name,
    start_time: r.start_time,
    end_time: r.end_time,
    division_count: Number(r.division_count) || 0,
    term1_fee: term1,
    term2_fee: term2,
    books_charge: books,
    total_fees: term1 + term2 + books,
  };
}

function listClassEntriesByBranch(branch_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM class_entries WHERE branch_id = ? ORDER BY class_name, shift_name`,
      [branch_id],
      (err, rows) => {
        if (err) return reject(err);
        resolve((rows || []).map(toRow));
      }
    );
  });
}

function addClassEntry(payload) {
  return new Promise((resolve, reject) => {
    const {
      branch_id,
      class_id = null,
      shift_id = null,
      class_name,
      shift_name,
      start_time = null,
      end_time = null,
      term1_fee = 0,
      term2_fee = 0,
      books_charge = 0,
      division_count = 0,
    } = payload || {};

    const fees = JSON.stringify({ term1: Number(term1_fee) || 0, term2: Number(term2_fee) || 0, books: Number(books_charge) || 0 });
    db.run(
      `INSERT INTO class_entries (branch_id, class_id, shift_id, class_name, shift_name, start_time, end_time, fees, division_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [branch_id, class_id, shift_id, class_name, shift_name, start_time, end_time, fees, Math.max(0, Number(division_count) || 0)],
      function (err) {
        if (err) return reject(err);
        db.get(`SELECT * FROM class_entries WHERE id = ?`, [this.lastID], (e, row) => {
          if (e) return reject(e);
          resolve(toRow(row));
        });
      }
    );
  });
}

function updateClassEntry(payload) {
  return new Promise((resolve, reject) => {
    const { id } = payload || {};
    if (!id) return reject(new Error("Missing id"));

    const sets = [];
    const vals = [];

    const fields = [
      "branch_id",
      "class_id",
      "shift_id",
      "class_name",
      "shift_name",
      "start_time",
      "end_time",
      "division_count",
    ];
    fields.forEach((f) => {
      if (typeof payload[f] !== "undefined") {
        sets.push(`${f} = ?`);
        vals.push(payload[f]);
      }
    });

    if (
      typeof payload.term1_fee !== "undefined" ||
      typeof payload.term2_fee !== "undefined" ||
      typeof payload.books_charge !== "undefined"
    ) {
      const fees = JSON.stringify({
        term1: Number(payload.term1_fee) || 0,
        term2: Number(payload.term2_fee) || 0,
        books: Number(payload.books_charge) || 0,
      });
      sets.push("fees = ?");
      vals.push(fees);
    }

    if (!sets.length) return resolve({ id });

    vals.push(id);
    db.run(`UPDATE class_entries SET ${sets.join(", ")} WHERE id = ?`, vals, function (err) {
      if (err) return reject(err);
      db.get(`SELECT * FROM class_entries WHERE id = ?`, [id], (e, row) => {
        if (e) return reject(e);
        resolve(toRow(row));
      });
    });
  });
}

function deleteClassEntry(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM class_entries WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve({ id });
    });
  });
}

module.exports = {
  listClassEntriesByBranch,
  addClassEntry,
  updateClassEntry,
  deleteClassEntry,
};
