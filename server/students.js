const db = require("./db");

// Get all students with class information, optionally filtered by branch_id and academic year
function getStudents(branch_id, academicYearId = null) {
  console.log(
    "[server/students.js] getStudents() called",
    branch_id ? `with branch_id=${branch_id}` : "",
    academicYearId ? `year=${academicYearId}` : ""
  );
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.class_id,
        s.academic_year_id,
        s.total_fees,
        s.pending_fees,
        s.division,
        s.parents_contact1,
        s.parents_contact2,
        s.admission_date,
        s.gender,
        s.mother_name,
        s.father_name,
        s.fee_scholarship,
        s.birth_place,
        s.religion,
        s.address,
        s.created_at,
        c.name as class_name,
        c.shift_name,
        b.name as branch_name,
        b.id as branch_id
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN branches b ON c.branch_id = b.id
    `;
    let params = [];
    const conditions = [];
    if (branch_id) {
      conditions.push("b.id = ?");
      params.push(branch_id);
    }
    if (academicYearId) {
      conditions.push("s.academic_year_id = ?");
      params.push(academicYearId);
    }
    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += " ORDER BY s.created_at DESC";
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error("[server/students.js] Error fetching students:", err);
        reject(err);
      } else {
        console.log("[server/students.js] Students found:", rows);
        resolve(rows);
      }
    });
  });
}

// Get a single student by ID (includes class/branch info)
function getStudentById(id) {
  console.log("[server/students.js] getStudentById() called with id=", id);
  return new Promise((resolve, reject) => {
    if (!id) return resolve(null);
    const sql = `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.class_id,
        s.academic_year_id,
        s.total_fees,
        s.pending_fees,
        s.division,
        s.parents_contact1,
        s.parents_contact2,
        s.admission_date,
        s.gender,
        s.mother_name,
        s.father_name,
        s.fee_scholarship,
        s.birth_place,
        s.religion,
        s.address,
        s.created_at,
        c.name as class_name,
        c.shift_name,
        b.name as branch_name,
        b.id as branch_id
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN branches b ON c.branch_id = b.id
      WHERE s.id = ?
      LIMIT 1
    `;
    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error(
          "[server/students.js] Error fetching student by id:",
          err
        );
        reject(err);
      } else {
        resolve(row || null);
      }
    });
  });
}

// Helper to resolve the academic year ID: use provided or fall back to active year
function resolveAcademicYearId(preferredId) {
  return new Promise((resolve) => {
    if (preferredId) return resolve(preferredId);
    db.get(
      `SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`,
      [],
      (err, row) => {
        if (err) {
          console.warn(
            "[server/students.js] Failed to get active academic year while resolving ID:",
            err
          );
          return resolve(null);
        }
        resolve((row && row.id) || null);
      }
    );
  });
}

// Get the next roll number for a class+division (max existing + 1), scoped by academic year
function getNextRollNumber(class_id, division, academicYearId = null) {
  console.log(
    "[server/students.js] getNextRollNumber() called with class_id=",
    class_id,
    "division=",
    division,
    "academicYearId=",
    academicYearId
  );
  return new Promise(async (resolve, reject) => {
    if (!class_id || !division) {
      return resolve(1); // default to 1 if inputs not selected yet
    }

    try {
      const yearId = await resolveAcademicYearId(academicYearId);

      const baseSql = `SELECT MAX(CAST(roll_number AS INTEGER)) AS max_roll FROM students WHERE class_id = ? AND division = ?`;
      const params = [class_id, division];
      const sql = yearId ? `${baseSql} AND academic_year_id = ?` : baseSql;
      if (yearId) params.push(yearId);

      db.get(sql, params, (err, row) => {
        if (err) {
          console.error(
            "[server/students.js] Error fetching max roll number:",
            err
          );
          reject(err);
        } else {
          const next =
            (row && row.max_roll ? parseInt(row.max_roll, 10) : 0) + 1;
          console.log(
            `[server/students.js] Next roll number for class ${class_id}, division ${division} (year ${
              yearId || "any"
            }) =`,
            next
          );
          resolve(next);
        }
      });
    } catch (e) {
      console.error("[server/students.js] Exception in getNextRollNumber:", e);
      reject(e);
    }
  });
}

// Search students by name, roll number, or class within an optional branch and academic year
function searchStudents(branch_id, query, academicYearId = null) {
  console.log(
    "[server/students.js] searchStudents() called",
    branch_id ? `with branch_id=${branch_id}` : "",
    `query=${query}`,
    academicYearId ? `year=${academicYearId}` : ""
  );
  return new Promise((resolve, reject) => {
    const q = `%${(query || "").trim()}%`;
    let sql = `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.class_id,
        s.academic_year_id,
        c.name as class_name,
        c.shift_name,
        b.name as branch_name,
        b.id as branch_id
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN branches b ON c.branch_id = b.id
      WHERE (
        s.name LIKE ? OR s.roll_number LIKE ? OR c.name LIKE ?
      )
    `;
    const params = [q, q, q];
    if (branch_id) {
      sql += " AND b.id = ?";
      params.push(branch_id);
    }
    if (academicYearId) {
      sql += " AND s.academic_year_id = ?";
      params.push(academicYearId);
    }
    sql += " ORDER BY s.name ASC LIMIT 50";
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error("[server/students.js] Error searching students:", err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Add a new student
function addStudent(studentData) {
  console.log("[server/students.js] addStudent() called with:", studentData);
  return new Promise((resolve, reject) => {
    const {
      name,
      roll_number,
      class_id,
      division,
      academic_year_id,
      parents_contact1,
      parents_contact2,
      admission_date,
      gender,
      mother_name,
      father_name,
      fee_scholarship,
      birth_place,
      religion,
      address,
    } = studentData;
    // Check for duplicate roll_number within the same class and division
    db.get(
      `SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND division = ?`,
      [roll_number, class_id, division || null],
      (err, row) => {
        if (err) {
          console.error(
            "[server/students.js] Error checking roll number:",
            err
          );
          reject(err);
        } else if (row) {
          reject(
            new Error(
              "Roll number already exists in this class and division. Please use a unique roll number for this class/division."
            )
          );
        } else {
          // Use fee data sent from frontend
          const {
            total_fees = 0,
            pending_fees = 0,
            fee_breakdown = null
          } = studentData;

          // Determine academic year id (use provided or active year)
          db.get(
            `SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`,
            [],
            (yearErr, yearRow) => {
              if (yearErr) {
                console.warn(
                  "[server/students.js] Failed to get active academic year, proceeding with null",
                  yearErr
                );
              }
              const yearIdToUse =
                academic_year_id || (yearRow && yearRow.id) || null;

              const fee_breakdown_json = typeof fee_breakdown === 'string' 
                ? fee_breakdown 
                : JSON.stringify(fee_breakdown);

              db.run(
                `
                INSERT INTO students (
                  name, roll_number, class_id, division, academic_year_id, parents_contact1, parents_contact2,
                  admission_date, gender, mother_name, father_name,
                  fee_scholarship, birth_place, religion, address, total_fees, pending_fees, fee_breakdown
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `,
                [
                  name,
                  roll_number,
                  class_id,
                  division || null,
                  yearIdToUse,
                  parents_contact1,
                  parents_contact2,
                  admission_date,
                  gender,
                  mother_name,
                  father_name,
                  fee_scholarship,
                  birth_place,
                  religion,
                  address,
                  total_fees,
                  pending_fees,
                  fee_breakdown_json,
                ],
                function (err) {
                  if (err) {
                    console.error(
                      "[server/students.js] Error adding student:",
                      err
                    );
                    reject(err);
                  } else {
                    console.log(
                      "[server/students.js] Student added with ID:",
                      this.lastID
                    );
                    resolve({
                      id: this.lastID,
                      ...studentData,
                      academic_year_id: yearIdToUse,
                      total_fees,
                      pending_fees,
                      fee_breakdown: fee_breakdown_json,
                    });
                  }
                }
              );
            }
          );
        }
      }
    );
  });
}

// Get all classes for dropdown
function getClasses() {
  console.log("[server/students.js] getClasses() called");
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        c.id,
        c.name as class_name,
        c.num_divisions,
        b.name as branch_name
      FROM classes c
      JOIN branches b ON c.branch_id = b.id
      ORDER BY b.name, c.name
    `,
      (err, rows) => {
        if (err) {
          console.error("[server/students.js] Error fetching classes:", err);
          reject(err);
        } else {
          console.log("[server/students.js] Classes found:", rows);
          resolve(rows);
        }
      }
    );
  });
}

// Update a student
function updateStudent(studentData) {
  console.log("[server/students.js] updateStudent() called with:", studentData);
  return new Promise((resolve, reject) => {
    const {
      id,
      name,
      roll_number,
      class_id,
      division,
      parents_contact1,
      parents_contact2,
      admission_date,
      gender,
      mother_name,
      father_name,
      fee_scholarship,
      birth_place,
      religion,
      address,
    } = studentData;

    // Check for duplicate roll_number within the same class and division (excluding current student)
    db.get(
      `SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND division = ? AND id != ?`,
      [roll_number, class_id, division || null, id],
      (err, row) => {
        if (err) {
          console.error(
            "[server/students.js] Error checking roll number:",
            err
          );
          reject(err);
        } else if (row) {
          reject(
            new Error(
              "Roll number already exists in this class/division. Please use a unique roll number for this combination."
            )
          );
        } else {
          // Use fee data sent from frontend
          const {
            total_fees = 0,
            pending_fees = 0,
            fee_breakdown = null
          } = studentData;

          const fee_breakdown_json = typeof fee_breakdown === 'string' 
            ? fee_breakdown 
            : JSON.stringify(fee_breakdown);

          db.run(
            `
            UPDATE students SET 
              name = ?, 
              roll_number = ?, 
              class_id = ?, 
              division = ?,
              parents_contact1 = ?,
              parents_contact2 = ?,
              admission_date = ?,
              gender = ?,
              mother_name = ?,
              father_name = ?,
              fee_scholarship = ?,
              birth_place = ?,
              religion = ?,
              address = ?,
              total_fees = ?,
              pending_fees = ?,
              fee_breakdown = ?
            WHERE id = ?
          `,
            [
              name,
              roll_number,
              class_id,
              division || null,
              parents_contact1,
              parents_contact2,
              admission_date,
              gender,
              mother_name,
              father_name,
              fee_scholarship,
              birth_place,
              religion,
              address,
              total_fees,
              pending_fees,
              fee_breakdown_json,
              id,
            ],
            function (err) {
              if (err) {
                console.error(
                  "[server/students.js] Error updating student:",
                  err
                );
                reject(err);
              } else {
                console.log(
                  "[server/students.js] Student updated with ID:",
                  id
                );
                resolve({
                  id,
                  ...studentData,
                  total_fees,
                  pending_fees,
                  fee_breakdown: fee_breakdown_json,
                });
              }
            }
          );
        }
      }
    );
  });
}

// Delete a student
function deleteStudent(id) {
  console.log(
    "🟣 [BACKEND] server/students.js: deleteStudent() called with id:",
    id
  );
  console.log("🟣 [BACKEND] server/students.js: ID type:", typeof id);
  console.log("🟣 [BACKEND] server/students.js: ID value:", JSON.stringify(id));

  return new Promise((resolve, reject) => {
    console.log(
      "🟣 [BACKEND] server/students.js: Executing SQL DELETE query..."
    );
    console.log(
      "🟣 [BACKEND] server/students.js: SQL Query: DELETE FROM students WHERE id = ?"
    );
    console.log("🟣 [BACKEND] server/students.js: SQL Parameters:", [id]);

    db.run(`DELETE FROM students WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error(
          "🟣 [BACKEND] server/students.js: Database error during delete:",
          err
        );
        console.error("🟣 [BACKEND] server/students.js: Error code:", err.code);
        console.error(
          "🟣 [BACKEND] server/students.js: Error message:",
          err.message
        );
        reject(err);
      } else {
        console.log(
          "🟣 [BACKEND] server/students.js: SQL DELETE executed successfully"
        );
        console.log("🟣 [BACKEND] server/students.js: Student ID:", id);
        console.log(
          "🟣 [BACKEND] server/students.js: Rows affected:",
          this.changes
        );
        console.log(
          "🟣 [BACKEND] server/students.js: Last insert row ID:",
          this.lastID
        );

        if (this.changes === 0) {
          console.log(
            "🟣 [BACKEND] server/students.js: No rows affected - student not found"
          );
          reject(new Error("Student not found"));
        } else {
          console.log(
            "🟣 [BACKEND] server/students.js: Delete successful, resolving with success"
          );
          resolve({ success: true, id });
        }
      }
    });
  });
}

// Unified helper: get next roll using class_entry_id + division
function getNextRollNumberByEntry(
  class_entry_id,
  division,
  academicYearId = null
) {
  console.log(
    "[server/students.js] getNextRollNumberByEntry() called with class_entry_id=",
    class_entry_id,
    "division=",
    division,
    "academicYearId=",
    academicYearId
  );
  return new Promise((resolve, reject) => {
    if (!class_entry_id || !division) return resolve(1);
    // determine academic year to scope under
    resolveAcademicYearId(academicYearId).then((yearId) => {
      db.get(
        `SELECT id as class_id, NULL as shift_id FROM classes WHERE id = ?`,
        [class_entry_id],
        (err, row) => {
          if (err) {
            console.error(
              "[server/students.js] Error fetching class_entry mapping:",
              err
            );
            return reject(err);
          }
          const class_id = row?.class_id || null;
          if (!class_id) {
            // Fallback default when mapping missing
            return resolve(1);
          }
          getNextRollNumber(class_id, division, yearId)
            .then(resolve)
            .catch(reject);
        }
      );
    });
  });
}

module.exports = {
  getStudents,
  searchStudents,
  addStudent,
  getNextRollNumber,
  getNextRollNumberByEntry,
  updateStudent,
  deleteStudent,
  getClasses,
  getStudentById,
};
