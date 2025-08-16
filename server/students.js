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
        s.shift_id,
        s.parents_contact1,
        s.parents_contact2,
        s.admission_date,
        s.admission_end_date,
        s.gender,
        s.mother_name,
        s.father_name,
        s.fee_scholarship,
        s.birth_place,
        s.religion,
        s.address,
        s.created_at,
        c.name as class_name,
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

// Get the next roll number for a class+shift (max existing + 1)
function getNextRollNumber(class_id, shift_id) {
  console.log("[server/students.js] getNextRollNumber() called with class_id=", class_id, "shift_id=", shift_id);
  return new Promise((resolve, reject) => {
    if (!class_id || !shift_id) {
      return resolve(1); // default to 1 if class not selected yet
    }
    db.get(
      `SELECT MAX(CAST(roll_number AS INTEGER)) AS max_roll FROM students WHERE class_id = ? AND shift_id = ?`,
      [class_id, shift_id],
      (err, row) => {
        if (err) {
          console.error("[server/students.js] Error fetching max roll number:", err);
          reject(err);
        } else {
          const next = (row && row.max_roll ? parseInt(row.max_roll, 10) : 0) + 1;
          console.log(`[server/students.js] Next roll number for class ${class_id}, shift ${shift_id} =`, next);
          resolve(next);
        }
      }
    );
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
      shift_id,
      academic_year_id,
      parents_contact1,
      parents_contact2,
      admission_date,
      admission_end_date,
      gender,
      mother_name,
      father_name,
      fee_scholarship,
      birth_place,
      religion,
      address,
    } = studentData;
    // Check for duplicate roll_number within the same class and shift
    db.get(
      `SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND shift_id = ?`,
      [roll_number, class_id, shift_id],
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
              "Roll number already exists in this class and shift. Please use a unique roll number for this class and shift."
            )
          );
        } else {
          // Fetch class fees to initialize total_fees and pending_fees
          db.get(
            `SELECT fees FROM classes WHERE id = ?`,
            [class_id],
            (classErr, classRow) => {
              if (classErr) {
                console.error(
                  "[server/students.js] Error fetching class fees:",
                  classErr
                );
                reject(classErr);
                return;
              }
              let total_fees_calc = 0;
              try {
                if (classRow && classRow.fees) {
                  const feesObj = JSON.parse(classRow.fees);
                  total_fees_calc = (feesObj.term1 || 0) + (feesObj.term2 || 0);
                }
              } catch (e) {
                console.warn(
                  "[server/students.js] Failed parsing class fees JSON, defaulting total_fees to 0"
                );
              }
              
              // Calculate pending fees: total fees minus scholarship amount
              const scholarshipAmount = parseFloat(fee_scholarship) || 0;
              const pending_fees_init = Math.max(0, total_fees_calc - scholarshipAmount);
              
              console.log(`[server/students.js] Fee calculation: total=${total_fees_calc}, scholarship=${scholarshipAmount}, pending=${pending_fees_init}`);

              // Determine academic year id (use provided or active year)
              db.get(
                `SELECT id FROM academic_years WHERE is_active = 1 LIMIT 1`,
                [],
                (yearErr, yearRow) => {
                  if (yearErr) {
                    console.warn("[server/students.js] Failed to get active academic year, proceeding with null", yearErr);
                  }
                  const yearIdToUse = academic_year_id || (yearRow && yearRow.id) || null;

                  db.run(
                    `
                    INSERT INTO students (
                      name, roll_number, class_id, shift_id, academic_year_id, parents_contact1, parents_contact2,
                      admission_date, admission_end_date, gender, mother_name, father_name,
                      fee_scholarship, birth_place, religion, address, total_fees, pending_fees
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                  `,
                    [
                      name,
                      roll_number,
                      class_id,
                      shift_id,
                      yearIdToUse,
                      parents_contact1,
                      parents_contact2,
                      admission_date,
                      admission_end_date,
                      gender,
                      mother_name,
                      father_name,
                      fee_scholarship,
                      birth_place,
                      religion,
                      address,
                      total_fees_calc,
                      pending_fees_init,
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
                          total_fees: total_fees_calc,
                          pending_fees: pending_fees_init,
                        });
                      }
                    }
                  );
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
      shift_id,
      parents_contact1,
      parents_contact2,
      admission_date,
      admission_end_date,
      gender,
      mother_name,
      father_name,
      fee_scholarship,
      birth_place,
      religion,
      address,
    } = studentData;

    // Check for duplicate roll_number within the same class and shift (excluding current student)
    db.get(
      `SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND shift_id = ? AND id != ?`,
      [roll_number, class_id, shift_id, id],
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
              "Roll number already exists in this class. Please use a unique roll number for this class."
            )
          );
        } else {
          db.run(
            `
            UPDATE students SET 
              name = ?, 
              roll_number = ?, 
              class_id = ?, 
              shift_id = ?,
              parents_contact1 = ?,
              parents_contact2 = ?,
              admission_date = ?,
              admission_end_date = ?,
              gender = ?,
              mother_name = ?,
              father_name = ?,
              fee_scholarship = ?,
              birth_place = ?,
              religion = ?,
              address = ?
            WHERE id = ?
          `,
            [
              name,
              roll_number,
              class_id,
              shift_id,
              parents_contact1,
              parents_contact2,
              admission_date,
              admission_end_date,
              gender,
              mother_name,
              father_name,
              fee_scholarship,
              birth_place,
              religion,
              address,
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
                resolve({ id, ...studentData });
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

module.exports = {
  getStudents,
  searchStudents,
  addStudent,
  getNextRollNumber,
  updateStudent,
  deleteStudent,
  getClasses,
};
