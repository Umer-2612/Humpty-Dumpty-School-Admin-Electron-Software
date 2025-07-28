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
        s.contact,
        s.address,
        s.parents_contact1,
        s.parents_contact2,
        s.admission_date,
        s.class_last_date,
        s.gender,
        s.mother_name,
        s.father_name,
        s.fee_scholarship,
        s.religion,
        s.class_div,
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
      contact,
      address,
      parents_contact1,
      parents_contact2,
      admission_date,
      class_last_date,
      gender,
      mother_name,
      father_name,
      fee_scholarship,
      religion,
      class_div,
    } = studentData;
    // Check for duplicate roll_number in the same class
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
          reject(new Error("Roll number already exists in this class."));
        } else {
          db.run(
            `
            INSERT INTO students (
              name, roll_number, class_id, contact, address,
              parents_contact1, parents_contact2, admission_date, class_last_date, gender,
              mother_name, father_name, fee_scholarship, religion, class_div
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              name,
              roll_number,
              class_id,
              contact,
              address,
              parents_contact1,
              parents_contact2,
              admission_date,
              class_last_date,
              gender,
              mother_name,
              father_name,
              fee_scholarship,
              religion,
              class_div,
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

module.exports = { getStudents, addStudent, getClasses };
