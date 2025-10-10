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

function addBranch({ name, sourceBranchId = null }) {
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

        const newBranch = { id: this.lastID, name: trimmed };
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          resolve(newBranch);
        };

        const requestedSourceId =
          sourceBranchId !== undefined && sourceBranchId !== null
            ? Number(sourceBranchId)
            : null;
        const hasRequestedSource =
          typeof requestedSourceId === "number" &&
          Number.isFinite(requestedSourceId) &&
          requestedSourceId > 0 &&
          requestedSourceId !== newBranch.id;

        const pickFallbackBranch = (callback) => {
          const baseBranchSql =
            "SELECT id FROM branches WHERE id <> ? ORDER BY id ASC LIMIT 1";
          db.get(baseBranchSql, [newBranch.id], (fallbackErr, fallbackRow) => {
            if (fallbackErr) {
              console.error(
                "[server/branches.js] Error finding fallback branch for class copy:",
                fallbackErr
              );
              return callback(null);
            }
            callback(fallbackRow?.id || null);
          });
        };

        const proceedWithSource = (sourceBranchIdToUse) => {
          if (!sourceBranchIdToUse) {
            return finish();
          }

          const fetchClassesSql = `
            SELECT name, shift_name, start_time, end_time, term1_fee, term2_fee, books_charge, num_divisions
            FROM classes
            WHERE branch_id = ?
          `;
          db.all(fetchClassesSql, [sourceBranchIdToUse], (classesErr, classRows) => {
            if (classesErr) {
              console.error(
                "[server/branches.js] Error loading classes for duplication:",
                classesErr
              );
              return finish();
            }

            if (!Array.isArray(classRows) || classRows.length === 0) {
              return finish();
            }

            const insertClassSql = `
              INSERT INTO classes (
                branch_id,
                name,
                shift_name,
                start_time,
                end_time,
                term1_fee,
                term2_fee,
                books_charge,
                num_divisions
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            let prepareFailed = false;
            const stmt = db.prepare(insertClassSql, (prepErr) => {
              if (prepErr) {
                prepareFailed = true;
                console.error(
                  "[server/branches.js] Error preparing class duplication statement:",
                  prepErr
                );
                finish();
              }
            });

            if (!stmt || prepareFailed) {
              if (!prepareFailed) {
                finish();
              }
              return;
            }
            let remaining = classRows.length;

            const handleComplete = () => {
              stmt.finalize((finalizeErr) => {
                if (finalizeErr) {
                  console.error(
                    "[server/branches.js] Error finalizing class duplication statement:",
                    finalizeErr
                  );
                }
                finish();
              });
            };

            classRows.forEach((cls) => {
              stmt.run(
                [
                  newBranch.id,
                  cls.name,
                  cls.shift_name || "",
                  cls.start_time || "",
                  cls.end_time || "",
                  Number(cls.term1_fee) || 0,
                  Number(cls.term2_fee) || 0,
                  Number(cls.books_charge) || 0,
                  Math.max(0, Number(cls.num_divisions) || 0),
                ],
                (copyErr) => {
                  if (copyErr) {
                    console.error(
                      "[server/branches.js] Error duplicating class for new branch:",
                      copyErr
                    );
                  }
                  remaining -= 1;
                  if (remaining === 0) {
                    handleComplete();
                  }
                }
              );
            });
          });
        };

        if (hasRequestedSource) {
          db.get(
            "SELECT id FROM branches WHERE id = ?",
            [requestedSourceId],
            (checkErr, checkRow) => {
              if (checkErr) {
                console.error(
                  "[server/branches.js] Error verifying requested source branch:",
                  checkErr
                );
                return pickFallbackBranch(proceedWithSource);
              }
              if (checkRow?.id) {
                proceedWithSource(checkRow.id);
              } else {
                pickFallbackBranch(proceedWithSource);
              }
            }
          );
        } else {
          pickFallbackBranch(proceedWithSource);
        }
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
