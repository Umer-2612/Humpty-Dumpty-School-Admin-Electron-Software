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
  const term1_fee = Number(r.term1_fee) || 0;
  const term2_fee = Number(r.term2_fee) || 0;
  const books_charge = Number(r.books_charge) || 0;
  const totalFees = term1_fee + term2_fee + books_charge;
  
  return {
    id: r.id,
    branch_id: r.branch_id,
    class_id: r.id,
    shift_id: null,
    class_name: r.class_name || r.name,
    shift_name: r.shift_name || "",
    start_time: r.start_time || "",
    end_time: r.end_time || "",
    division_count: Number(r.division_count || r.num_divisions) || 0,
    term1_fee: term1_fee,
    term2_fee: term2_fee,
    books_charge: books_charge,
    total_fees: totalFees,
  };
}

function listClassesByBranch(branch_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.*, c.name as class_name, c.shift_name, c.start_time, c.end_time, c.num_divisions as division_count 
       FROM classes c WHERE c.branch_id = ? ORDER BY c.name`,
      [branch_id],
      (err, rows) => {
        if (err) return reject(err);
        resolve((rows || []).map(toRow));
      }
    );
  });
}

function addClass(payload) {
  return new Promise((resolve, reject) => {
    const {
      branch_id,
      class_name,
      shift_name,
      start_time = null,
      end_time = null,
      term1_fee = 0,
      term2_fee = 0,
      books_charge = 0,
      division_count = 0,
    } = payload || {};

    db.run(
      `INSERT INTO classes (branch_id, name, shift_name, start_time, end_time, term1_fee, term2_fee, books_charge, num_divisions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        branch_id,
        class_name,
        shift_name || "",
        start_time || "",
        end_time || "",
        Number(term1_fee) || 0,
        Number(term2_fee) || 0,
        Number(books_charge) || 0,
        Math.max(0, Number(division_count) || 0),
      ],
      function (err) {
        if (err) return reject(err);
        db.get(
          `SELECT c.*, c.name as class_name, c.shift_name, c.start_time, c.end_time, c.num_divisions as division_count FROM classes c WHERE id = ?`,
          [this.lastID],
          (e, row) => {
            if (e) return reject(e);
            resolve(toRow(row));
          }
        );
      }
    );
  });
}

function updateClass(payload) {
  return new Promise((resolve, reject) => {
    const { id } = payload || {};
    if (!id) return reject(new Error("Missing id"));

    const sets = [];
    const vals = [];

    // Map frontend fields to database fields
    const fieldMapping = {
      branch_id: "branch_id",
      class_name: "name",
      division_count: "num_divisions",
      shift_name: "shift_name",
      start_time: "start_time",
      end_time: "end_time",
    };

    Object.keys(fieldMapping).forEach((frontendField) => {
      if (typeof payload[frontendField] !== "undefined") {
        const dbField = fieldMapping[frontendField];
        sets.push(`${dbField} = ?`);
        vals.push(payload[frontendField]);
      }
    });

    // Handle individual fee fields
    if (typeof payload.term1_fee !== "undefined") {
      sets.push("term1_fee = ?");
      vals.push(Number(payload.term1_fee) || 0);
    }
    if (typeof payload.term2_fee !== "undefined") {
      sets.push("term2_fee = ?");
      vals.push(Number(payload.term2_fee) || 0);
    }
    if (typeof payload.books_charge !== "undefined") {
      sets.push("books_charge = ?");
      vals.push(Number(payload.books_charge) || 0);
    }

    if (!sets.length) return resolve({ id });

    vals.push(id);
    db.run(
      `UPDATE classes SET ${sets.join(", ")} WHERE id = ?`,
      vals,
      function (err) {
        if (err) return reject(err);
        db.get(
          `SELECT c.*, c.name as class_name, c.shift_name, c.start_time, c.end_time, c.num_divisions as division_count FROM classes c WHERE id = ?`,
          [id],
          (e, row) => {
            if (e) return reject(e);
            resolve(toRow(row));
          }
        );
      }
    );
  });
}

function deleteClass(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM classes WHERE id = ?`, [id], function (err) {
      if (err) return reject(err);
      resolve({ id });
    });
  });
}

module.exports = {
  listClassesByBranch,
  addClass,
  updateClass,
  deleteClass,
};
