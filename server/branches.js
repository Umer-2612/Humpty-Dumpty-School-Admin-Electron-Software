const db = require("./db");

function normalizeName(name) {
  return (name || "").toString().trim();
}

function getBranches() {
  console.log("[server/branches.js] getBranches() called");
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM branches ORDER BY name COLLATE NOCASE ASC", [], (err, rows) => {
      if (err) {
        console.error("[server/branches.js] Error fetching branches:", err);
        reject(err);
      } else {
        console.log("[server/branches.js] Branches found:", rows);
        resolve(rows);
      }
    });
  });
}

function addBranch({ name }) {
  return new Promise((resolve, reject) => {
    const trimmed = normalizeName(name);
    if (!trimmed) {
      return reject(new Error("Branch name is required"));
    }

    const checkSql = "SELECT id FROM branches WHERE LOWER(name) = LOWER(?)";
    db.get(checkSql, [trimmed], (checkErr, row) => {
      if (checkErr) {
        console.error("[server/branches.js] Error checking duplicate branch:", checkErr);
        return reject(checkErr);
      }
      if (row) {
        return reject(new Error("Branch with this name already exists"));
      }

      const insertSql = "INSERT INTO branches (name) VALUES (?)";
      db.run(insertSql, [trimmed], function (insertErr) {
        if (insertErr) {
          console.error("[server/branches.js] Error inserting branch:", insertErr);
          return reject(insertErr);
        }

        resolve({ id: this.lastID, name: trimmed });
      });
    });
  });
}

function updateBranch({ id, name }) {
  return new Promise((resolve, reject) => {
    if (!id) {
      return reject(new Error("Branch id is required"));
    }
    const trimmed = normalizeName(name);
    if (!trimmed) {
      return reject(new Error("Branch name is required"));
    }

    const checkSql = "SELECT id FROM branches WHERE LOWER(name) = LOWER(?) AND id <> ?";
    db.get(checkSql, [trimmed, id], (checkErr, row) => {
      if (checkErr) {
        console.error("[server/branches.js] Error checking branch duplicates:", checkErr);
        return reject(checkErr);
      }
      if (row) {
        return reject(new Error("Another branch with this name already exists"));
      }

      const updateSql = "UPDATE branches SET name = ? WHERE id = ?";
      db.run(updateSql, [trimmed, id], function (updateErr) {
        if (updateErr) {
          console.error("[server/branches.js] Error updating branch:", updateErr);
          return reject(updateErr);
        }

        if (this.changes === 0) {
          return reject(new Error("Branch not found"));
        }

        resolve({ id, name: trimmed });
      });
    });
  });
}

function deleteBranch(id) {
  return new Promise((resolve, reject) => {
    if (!id) {
      return reject(new Error("Branch id is required"));
    }
    const branchId = Number(id);

    db.serialize(() => {
      db.get(
        "SELECT COUNT(*) AS cnt FROM classes WHERE branch_id = ?",
        [branchId],
        (classErr, classRow) => {
          if (classErr) {
            console.error("[server/branches.js] Error checking classes for branch:", classErr);
            return reject(classErr);
          }
          if (classRow?.cnt > 0) {
            return reject(
              new Error("Cannot delete branch while classes are assigned to it")
            );
          }

          db.get(
            "SELECT COUNT(*) AS cnt FROM fees WHERE branch_id = ?",
            [branchId],
            (feesErr, feesRow) => {
              if (feesErr) {
                console.error("[server/branches.js] Error checking fees for branch:", feesErr);
                return reject(feesErr);
              }
              if (feesRow?.cnt > 0) {
                return reject(
                  new Error("Cannot delete branch while fee records exist for it")
                );
              }

              db.run(
                "DELETE FROM branches WHERE id = ?",
                [branchId],
                function (deleteErr) {
                  if (deleteErr) {
                    console.error("[server/branches.js] Error deleting branch:", deleteErr);
                    return reject(deleteErr);
                  }
                  if (this.changes === 0) {
                    return reject(new Error("Branch not found"));
                  }
                  resolve({ id: branchId });
                }
              );
            }
          );
        }
      );
    });
  });
}

module.exports = { getBranches, addBranch, updateBranch, deleteBranch };
