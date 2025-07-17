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

  // Classes table
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES branches (id)
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id)
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
  db.get("SELECT COUNT(*) as count FROM classes", (err, row) => {
    if (row.count === 0) {
      db.run(`INSERT INTO classes (branch_id, name) VALUES (1, 'Nursery')`);
      db.run(`INSERT INTO classes (branch_id, name) VALUES (1, 'LKG')`);
      db.run(`INSERT INTO classes (branch_id, name) VALUES (1, 'UKG')`);
      db.run(`INSERT INTO classes (branch_id, name) VALUES (2, 'Class 1')`);
      db.run(`INSERT INTO classes (branch_id, name) VALUES (2, 'Class 2')`);
    }
  });
});

module.exports = db;
