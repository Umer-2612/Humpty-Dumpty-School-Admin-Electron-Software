const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = path.join(
  require("electron").app.getPath("userData"),
  "school.db"
);

console.log("Database path:", dbPath);

// Create DB file if not exists
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, "");
}

const db = new sqlite3.Database(dbPath);

// Initialize schema
db.serialize(() => {
  // Branches table
  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  // Remove old divisions table if present
  db.run(`DROP TABLE IF EXISTS divisions;`);

  // Remove division_id from classes if present (SQLite doesn't support DROP COLUMN directly, so skip for now)
  // (If needed, migration can be done manually)

  // New divisions table: per-class
  db.run(`
    CREATE TABLE IF NOT EXISTS divisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      UNIQUE(class_id, name),
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );
  `);

  // Classes table (add division_id)
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      fees TEXT,
      division_id INTEGER,
      FOREIGN KEY (branch_id) REFERENCES branches (id),
      FOREIGN KEY (division_id) REFERENCES divisions (id)
    );
  `);

  // Students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_number TEXT UNIQUE NOT NULL,
      class_id INTEGER NOT NULL,
      contact TEXT,
      address TEXT,
      parents_contact1 TEXT,
      parents_contact2 TEXT,
      admission_date TEXT,
      class_last_date TEXT,
      gender TEXT,
      mother_name TEXT,
      father_name TEXT,
      fee_scholarship INTEGER,
      religion TEXT,
      class_div TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id)
    );
  `);

  // Migration: add columns if they do not exist
  const studentColumns = [
    { name: "parents_contact1", type: "TEXT" },
    { name: "parents_contact2", type: "TEXT" },
    { name: "admission_date", type: "TEXT" },
    { name: "class_last_date", type: "TEXT" },
    { name: "gender", type: "TEXT" },
    { name: "mother_name", type: "TEXT" },
    { name: "father_name", type: "TEXT" },
    { name: "fee_scholarship", type: "INTEGER" },
    { name: "religion", type: "TEXT" },
    { name: "class_div", type: "TEXT" },
  ];
  db.all("PRAGMA table_info(students)", (err, columns) => {
    if (!err && columns) {
      const existing = columns.map((col) => col.name);
      studentColumns.forEach((col) => {
        if (!existing.includes(col.name)) {
          db.run(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`);
        }
      });
    }
  });

  // Migration: add division_id to classes if not exists
  db.all("PRAGMA table_info(classes)", (err, columns) => {
    if (!err && columns) {
      const existing = columns.map((col) => col.name);
      if (!existing.includes("division_id")) {
        db.run(`ALTER TABLE classes ADD COLUMN division_id INTEGER`);
      }
    }
  });

  // Teachers table
  db.run(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT
    );
  `);

  // Class Shifts table
  db.run(`
    CREATE TABLE IF NOT EXISTS class_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      time TEXT
    );
  `);

  // Join table for teacher-class-shift assignments
  db.run(`
    CREATE TABLE IF NOT EXISTS teacher_class_shift (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      shift_id INTEGER NOT NULL,
      FOREIGN KEY (teacher_id) REFERENCES teachers (id),
      FOREIGN KEY (class_id) REFERENCES classes (id),
      FOREIGN KEY (shift_id) REFERENCES class_shifts (id)
    );
  `);

  // Settings table for user/global preferences
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed branches if empty
  db.get("SELECT COUNT(*) as count FROM branches", (err, row) => {
    if (row.count === 0) {
      db.run(
        `INSERT INTO branches (name) VALUES ('Humpty Dumpty Kindergarden')`
      );
      db.run(
        `INSERT INTO branches (name) VALUES ('Humpty Dumpty Charitable Trust')`
      );
    }
  });

  // Seed some classes if empty
  // db.get("SELECT COUNT(*) as count FROM classes", (err, row) => {
  //   if (row.count === 0) {
  //     const defaultFees = JSON.stringify({ term1: 5000, term2: 5000 });
  //     db.run(
  //       `INSERT INTO classes (branch_id, name, fees) VALUES (1, 'Nursery', ?)`,
  //       defaultFees
  //     );
  //     db.run(
  //       `INSERT INTO classes (branch_id, name, fees) VALUES (1, 'LKG', ?)`,
  //       defaultFees
  //     );
  //     db.run(
  //       `INSERT INTO classes (branch_id, name, fees) VALUES (1, 'UKG', ?)`,
  //       defaultFees
  //     );
  //     db.run(
  //       `INSERT INTO classes (branch_id, name, fees) VALUES (2, 'Class 1', ?)`,
  //       defaultFees
  //     );
  //     db.run(
  //       `INSERT INTO classes (branch_id, name, fees) VALUES (2, 'Class 2', ?)`,
  //       defaultFees
  //     );
  //   }
  // });
});

module.exports = db;
