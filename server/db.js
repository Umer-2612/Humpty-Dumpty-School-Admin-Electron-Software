const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "school.db");

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

  // Academic Years table (global)
  db.run(`
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,          -- e.g. '2025-26'
      start_date TEXT NOT NULL,           -- ISO date
      end_date TEXT NOT NULL,             -- ISO date
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Seed a default academic year if none exist
  db.get(`SELECT COUNT(*) as cnt FROM academic_years`, (err, row) => {
    if (err) {
      console.warn("[db.js] Failed to count academic_years:", err);
      return;
    }
    if (row && row.cnt === 0) {
      try {
        const now = new Date();
        // Academic year starting April 1st by default
        const startYear =
          now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        const endYear = startYear + 1;
        const name = `${startYear}-${String(endYear).slice(-2)}`; // e.g. 2025-26
        const start_date = `${startYear}-04-01`;
        const end_date = `${endYear}-03-31`;
        db.run(
          `INSERT OR IGNORE INTO academic_years (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)`,
          [name, start_date, end_date],
          (insErr) => {
            if (insErr) {
              console.warn(
                "[db.js] Failed to seed default academic year:",
                insErr
              );
            } else {
              console.log("[db.js] Seeded default academic year:", {
                name,
                start_date,
                end_date,
              });
            }
            // Ensure exactly one active academic year (the generated name)
            db.run(
              `UPDATE academic_years SET is_active = CASE WHEN name = ? THEN 1 ELSE 0 END`,
              [name]
            );
          }
        );
      } catch (e) {
        console.warn(
          "[db.js] Exception while seeding default academic year",
          e
        );
      }
    }
  });

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
      roll_number TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      shift_id INTEGER,
      parents_contact1 TEXT,
      parents_contact2 TEXT,
      admission_date TEXT,
      admission_end_date TEXT,
      gender TEXT,
      mother_name TEXT,
      father_name TEXT,
      fee_scholarship INTEGER,
      birth_place TEXT,
      religion TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id),
      UNIQUE (roll_number, class_id)
    );
  `);

  // Transport table (common for both branches)
  db.run(`
    CREATE TABLE IF NOT EXISTS transport (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_name TEXT NOT NULL,
      driver_route TEXT NOT NULL,
      driver_car TEXT NOT NULL,
      driver_car_number TEXT UNIQUE NOT NULL,
      driver_contact TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Fees table (branch-wise fees collection records)
  // Fresh installs allow 'cash', 'cheque', and 'upi'
  db.run(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      amount DECIMAL(10,2) NOT NULL,
      payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'cheque', 'upi')),
      cheque_number TEXT,
      bank_name TEXT,
      payee_name TEXT NOT NULL,
      receipt_number TEXT UNIQUE NOT NULL,
      payment_date DATE NOT NULL,
      academic_year TEXT,
      month_year TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id),
      FOREIGN KEY (branch_id) REFERENCES branches (id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
    );
  `);

  // Migration: upgrade existing fees table constraint to include 'upi' in payment_type CHECK
  db.get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='fees'",
    (err, row) => {
      if (err) return; // silently skip
      const ddl = row && row.sql ? row.sql : "";
      const hasOldConstraint = ddl.includes(
        "CHECK (payment_type IN ('cash', 'cheque'))"
      );
      const hasNewConstraint = ddl.includes(
        "CHECK (payment_type IN ('cash', 'cheque', 'upi'))"
      );
      if (hasOldConstraint && !hasNewConstraint) {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          db.run(`
            CREATE TABLE IF NOT EXISTS fees_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              student_id INTEGER NOT NULL,
              branch_id INTEGER NOT NULL,
              academic_year_id INTEGER,
              amount DECIMAL(10,2) NOT NULL,
              payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'cheque', 'upi')),
              cheque_number TEXT,
              bank_name TEXT,
              payee_name TEXT NOT NULL,
              receipt_number TEXT UNIQUE NOT NULL,
              payment_date DATE NOT NULL,
              academic_year TEXT,
              month_year TEXT,
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (student_id) REFERENCES students (id),
              FOREIGN KEY (branch_id) REFERENCES branches (id),
              FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
            );
          `);
          // Copy data
          db.run(`
            INSERT INTO fees_new (
              id, student_id, branch_id, academic_year_id, amount, payment_type, cheque_number, bank_name,
              payee_name, receipt_number, payment_date, academic_year, month_year, notes, created_at
            )
            SELECT id, student_id, branch_id, NULL as academic_year_id, amount, payment_type, cheque_number, bank_name,
                   payee_name, receipt_number, payment_date, academic_year, month_year, notes, created_at
            FROM fees;
          `);
          db.run("DROP TABLE fees");
          db.run("ALTER TABLE fees_new RENAME TO fees");
          db.run("COMMIT");
        });
      }
    }
  );

  // Migration: add columns if they do not exist
  const studentColumns = [
    { name: "shift_id", type: "INTEGER" },
    { name: "parents_contact1", type: "TEXT" },
    { name: "parents_contact2", type: "TEXT" },
    { name: "admission_date", type: "TEXT" },
    { name: "admission_end_date", type: "TEXT" },
    { name: "gender", type: "TEXT" },
    { name: "mother_name", type: "TEXT" },
    { name: "father_name", type: "TEXT" },
    { name: "fee_scholarship", type: "INTEGER" },
    { name: "birth_place", type: "TEXT" },
    { name: "religion", type: "TEXT" },
    // New fee tracking fields
    { name: "total_fees", type: "INTEGER" },
    { name: "pending_fees", type: "INTEGER" },
  ];

  // Migration: rename class_last_date to admission_end_date if it exists
  db.all("PRAGMA table_info(students)", (err, columns) => {
    if (!err && columns) {
      const existing = columns.map((col) => col.name);
      if (
        existing.includes("class_last_date") &&
        !existing.includes("admission_end_date")
      ) {
        db.run(`ALTER TABLE students ADD COLUMN admission_end_date TEXT`);
        db.run(
          `UPDATE students SET admission_end_date = class_last_date WHERE class_last_date IS NOT NULL`
        );
        // Note: SQLite doesn't support DROP COLUMN; we keep class_last_date
      }
      // Ensure academic_year_id exists on students
      if (!existing.includes("academic_year_id")) {
        db.run(`ALTER TABLE students ADD COLUMN academic_year_id INTEGER`);
      }
      studentColumns.forEach((col) => {
        if (!existing.includes(col.name)) {
          db.run(`ALTER TABLE students ADD COLUMN ${col.name} ${col.type}`);
        }
      });
    }
  });

  // Ensure academic_year_id in fees table exists (for older installs that already had new payment_type migration)
  db.all("PRAGMA table_info(fees)", (err, columns) => {
    if (!err && columns) {
      const existing = columns.map((c) => c.name);
      if (!existing.includes("academic_year_id")) {
        db.run(`ALTER TABLE fees ADD COLUMN academic_year_id INTEGER`);
      }
    }
  });

  // Migration: Fix roll_number constraint from global UNIQUE to class-wise UNIQUE
  // This migration recreates the students table with the correct constraint
  db.get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='students'",
    (err, result) => {
      if (!err && result && result.sql.includes("roll_number TEXT UNIQUE")) {
        console.log(
          "[db.js] Migrating students table to fix roll_number constraint..."
        );

        // Create new table with correct schema
        db.run(
          `
        CREATE TABLE students_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          roll_number TEXT NOT NULL,
          class_id INTEGER NOT NULL,
          shift_id INTEGER,
          parents_contact1 TEXT,
          parents_contact2 TEXT,
          admission_date TEXT,
          admission_end_date TEXT,
          gender TEXT,
          mother_name TEXT,
          father_name TEXT,
          fee_scholarship INTEGER,
          birth_place TEXT,
          religion TEXT,
          address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (class_id) REFERENCES classes (id),
          UNIQUE (roll_number, class_id)
        );
      `,
          (err) => {
            if (!err) {
              // Copy data from old table to new table
              db.run(
                `
            INSERT INTO students_new 
            SELECT * FROM students;
          `,
                (err) => {
                  if (!err) {
                    // Drop old table and rename new table
                    db.run(`DROP TABLE students`, (err) => {
                      if (!err) {
                        db.run(
                          `ALTER TABLE students_new RENAME TO students`,
                          (err) => {
                            if (!err) {
                              console.log(
                                "[db.js] Successfully migrated students table with class-wise roll_number constraint"
                              );
                            } else {
                              console.error(
                                "[db.js] Error renaming migrated students table:",
                                err
                              );
                            }
                          }
                        );
                      } else {
                        console.error(
                          "[db.js] Error dropping old students table:",
                          err
                        );
                      }
                    });
                  } else {
                    console.error(
                      "[db.js] Error copying data to new students table:",
                      err
                    );
                  }
                }
              );
            } else {
              console.error("[db.js] Error creating new students table:", err);
            }
          }
        );
      }
    }
  );

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

  // Seed class shifts if empty
  db.get("SELECT COUNT(*) as count FROM class_shifts", (err, row) => {
    if (row.count === 0) {
      db.run(
        `INSERT INTO class_shifts (name, time) VALUES ('Morning', '8:00 AM')`
      );
      db.run(
        `INSERT INTO class_shifts (name, time) VALUES ('Afternoon', '12:00 PM')`
      );
    }
  });

  // Seed default academic year if none exists
  db.get("SELECT COUNT(*) as count FROM academic_years", (err, row) => {
    if (!err && row && row.count === 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-12
      // Academic year June -> May
      const startYear = month >= 6 ? year : year - 1;
      const endYear = startYear + 1;
      const name = `${startYear}-${String(endYear).slice(-2)}`;
      const start_date = `${startYear}-06-01`;
      const end_date = `${endYear}-05-31`;
      db.run(
        `INSERT INTO academic_years (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)`,
        [name, start_date, end_date]
      );
    }
  });

  // Seed classes if empty
  db.get("SELECT COUNT(*) as count FROM classes", (err, row) => {
    if (row.count === 0) {
      // Humpty Dumpty Day Care classes
      const dayCareFees = JSON.stringify({ term1: 9000, term2: 9000 });
      const juniorKgFees = JSON.stringify({ term1: 10000, term2: 10000 });

      // Humpty Dumpty Charitable Trust classes
      const seniorKgFees = JSON.stringify({ term1: 11000, term2: 11000 });
      const balVatikaFees = JSON.stringify({ term1: 12000, term2: 12000 });

      // Insert classes for Humpty Dumpty Kindergarden (branch_id = 1)
      db.run(
        `INSERT INTO classes (branch_id, name, fees) VALUES (2, 'Day Care', ?)`,
        dayCareFees
      );
      db.run(
        `INSERT INTO classes (branch_id, name, fees) VALUES (2, 'Junior Kg', ?)`,
        juniorKgFees
      );

      // Insert classes for Humpty Dumpty Charitable Trust (branch_id = 2)
      db.run(
        `INSERT INTO classes (branch_id, name, fees) VALUES (1, 'Senior Kg', ?)`,
        seniorKgFees
      );
      db.run(
        `INSERT INTO classes (branch_id, name, fees) VALUES (1, 'Bal Vatika', ?)`,
        balVatikaFees
      );
    }
  });
});

module.exports = db;
