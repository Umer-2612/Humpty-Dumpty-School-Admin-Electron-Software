const db = require("./db");

// Get all students with class information
function getStudents() {
  console.log("[server/students.js] getStudents() called");
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        s.id,
        s.name,
        s.roll_number,
        s.contact,
        s.address,
        s.created_at,
        c.name as class_name,
        b.name as branch_name
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN branches b ON c.branch_id = b.id
      ORDER BY s.created_at DESC
    `,
      (err, rows) => {
        if (err) {
          console.error("[server/students.js] Error fetching students:", err);
          reject(err);
        } else {
          console.log("[server/students.js] Students found:", rows);
          resolve(rows);
        }
      }
    );
  });
}

// Add a new student
function addStudent(studentData) {
  console.log("[server/students.js] addStudent() called with:", studentData);
  return new Promise((resolve, reject) => {
    const { name, roll_number, class_id, contact, address } = studentData;

    db.run(
      `
      INSERT INTO students (name, roll_number, class_id, contact, address)
      VALUES (?, ?, ?, ?, ?)
    `,
      [name, roll_number, class_id, contact, address],
      function (err) {
        if (err) {
          console.error("[server/students.js] Error adding student:", err);
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
