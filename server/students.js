const db = require("./db");

// Get all students with class information, optionally filtered by branch_id
function getStudents(branch_id) {
  console.log(
    "[server/students.js] getStudents() called",
    branch_id ? `with branch_id=${branch_id}` : ""
  );
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.class_id,
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
    if (branch_id) {
      query += " WHERE b.id = ?";
      params.push(branch_id);
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

// Add a new student
function addStudent(studentData) {
  console.log("[server/students.js] addStudent() called with:", studentData);
  return new Promise((resolve, reject) => {
    const {
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
    // Check for duplicate roll_number within the same class
    db.get(
      `SELECT id FROM students WHERE roll_number = ? AND class_id = ?`,
      [roll_number, class_id],
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
            INSERT INTO students (
              name, roll_number, class_id, shift_id, parents_contact1, parents_contact2,
              admission_date, admission_end_date, gender, mother_name, father_name,
              fee_scholarship, birth_place, religion, address
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                resolve({ id: this.lastID, ...studentData });
              }
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

    // Check for duplicate roll_number within the same class (excluding current student)
    db.get(
      `SELECT id FROM students WHERE roll_number = ? AND class_id = ? AND id != ?`,
      [roll_number, class_id, id],
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
  console.log("🟣 [BACKEND] server/students.js: deleteStudent() called with id:", id);
  console.log("🟣 [BACKEND] server/students.js: ID type:", typeof id);
  console.log("🟣 [BACKEND] server/students.js: ID value:", JSON.stringify(id));
  
  return new Promise((resolve, reject) => {
    console.log("🟣 [BACKEND] server/students.js: Executing SQL DELETE query...");
    console.log("🟣 [BACKEND] server/students.js: SQL Query: DELETE FROM students WHERE id = ?");
    console.log("🟣 [BACKEND] server/students.js: SQL Parameters:", [id]);
    
    db.run(
      `DELETE FROM students WHERE id = ?`,
      [id],
      function (err) {
        if (err) {
          console.error(
            "🟣 [BACKEND] server/students.js: Database error during delete:",
            err
          );
          console.error(
            "🟣 [BACKEND] server/students.js: Error code:",
            err.code
          );
          console.error(
            "🟣 [BACKEND] server/students.js: Error message:",
            err.message
          );
          reject(err);
        } else {
          console.log(
            "🟣 [BACKEND] server/students.js: SQL DELETE executed successfully"
          );
          console.log(
            "🟣 [BACKEND] server/students.js: Student ID:",
            id
          );
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
      }
    );
  });
}

module.exports = { getStudents, addStudent, getClasses, updateStudent, deleteStudent };
