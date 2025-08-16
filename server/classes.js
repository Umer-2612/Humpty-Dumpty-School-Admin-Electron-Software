const db = require("./db");

// Get all classes for a branch
function getClassesByBranch(branch_id) {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT 
         c.id, c.name, c.fees, c.num_divisions,
         b.name as branch_name
       FROM classes c 
       JOIN branches b ON c.branch_id = b.id 
       WHERE c.branch_id = ? 
       ORDER BY c.name`,
      [branch_id],
      (err, rows) => {
        if (err) return reject(err);
        // Calculate total fees and expose fee parts for each class
        const result = rows.map((row) => {
          let term1 = 0;
          let term2 = 0;
          let books = 0;
          if (row.fees) {
            try {
              const feesObj = JSON.parse(row.fees);
              term1 = Number(feesObj.term1) || 0;
              term2 = Number(feesObj.term2) || 0;
              books = Number(feesObj.books ?? feesObj.books_charge) || 0;
            } catch (e) {
              // ignore parse errors; default zeros
            }
          }
          const total_fees = term1 + term2 + books;
          return {
            ...row,
            num_divisions: Number(row.num_divisions ?? 0),
            total_fees,
            term1_fee: term1,
            term2_fee: term2,
            books_charge: books,
          };
        });
        resolve(result);
      }
    );
  });
}

// Add a new class
function addClass({
  name,
  branch_id,
  term1_fee = 0,
  term2_fee = 0,
  books_charge = 0,
  num_divisions = 0,
}) {
  return new Promise((resolve, reject) => {
    const term1 = Number(term1_fee) || 0;
    const term2 = Number(term2_fee) || 0;
    const books = Number(books_charge) || 0;
    const fees = JSON.stringify({ term1, term2, books });
    const divisions = Math.max(0, Number(num_divisions) || 0);
    db.run(
      `INSERT INTO classes (name, branch_id, fees, num_divisions) VALUES (?, ?, ?, ?)`,
      [name, branch_id, fees, divisions],
      function (err) {
        if (err) return reject(err);
        const class_id = this.lastID;
        resolve({
          id: class_id,
          name,
          branch_id,
          fees,
          num_divisions: divisions,
        });
      }
    );
  });
}

// Update a class
function updateClass({
  id,
  name,
  term1_fee,
  term2_fee,
  books_charge,
  num_divisions,
}) {
  return new Promise((resolve, reject) => {
    let updateFields = [];
    let sets = [];
    if (typeof name !== "undefined") {
      sets.push("name = ?");
      updateFields.push(name);
    }

    if (
      typeof term1_fee !== "undefined" ||
      typeof term2_fee !== "undefined" ||
      typeof books_charge !== "undefined"
    ) {
      const term1 = Number(term1_fee) || 0;
      const term2 = Number(term2_fee) || 0;
      const books = Number(books_charge) || 0;
      const fees = JSON.stringify({ term1, term2, books });
      sets.push("fees = ?");
      updateFields.push(fees);
    }

    if (typeof num_divisions !== "undefined") {
      sets.push("num_divisions = ?");
      updateFields.push(Math.max(0, Number(num_divisions) || 0));
    }

    if (sets.length === 0) {
      return resolve({ id, name });
    }

    const sql = `UPDATE classes SET ${sets.join(", ")} WHERE id = ?`;
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
