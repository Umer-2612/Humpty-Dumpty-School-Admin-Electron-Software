const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Determine DB directory
let dbDir;
try {
  const { app } = require("electron");
  if (app && typeof app.getPath === "function") {
    dbDir = app.getPath("userData");
  }
} catch (_) {
  // Not running under Electron
}
if (!dbDir) {
  dbDir = __dirname;
}

const dbPath = path.join(dbDir, "school.db");

// Create DB file if not exists
try {
  const parent = path.dirname(dbPath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "");
  }
} catch (fsErr) {
  console.error(
    `Failed to prepare database file/directory: ${fsErr?.message || fsErr}`
  );
}

let db;
try {
  db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error(`SQLite open error: ${err.message}`);
      } else {
        console.log(`SQLite opened successfully at: ${dbPath}`);
      }
    }
  );
} catch (openErr) {
  console.error(
    `Failed to open SQLite database: ${openErr?.message || openErr}`
  );
  throw openErr;
}

// Initialize schema
db.serialize(() => {
  // Branches table
  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Academic Years table
  db.run(`
    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Classes table
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      shift_name TEXT DEFAULT '',
      start_time TEXT DEFAULT '',
      end_time TEXT DEFAULT '',
      term1_fee DECIMAL(10,2) DEFAULT 0,
      term2_fee DECIMAL(10,2) DEFAULT 0,
      books_charge DECIMAL(10,2) DEFAULT 0,
      num_divisions INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
  `);

  // Students table
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      division TEXT,
      parents_contact1 TEXT,
      parents_contact2 TEXT,
      admission_date TEXT,
      gender TEXT,
      mother_name TEXT,
      father_name TEXT,
      fee_scholarship DECIMAL(10,2) DEFAULT 0,
      birth_place TEXT,
      religion TEXT,
      address TEXT,
      academic_year_id INTEGER,
      total_fees DECIMAL(10,2) DEFAULT 0,
      pending_fees DECIMAL(10,2) DEFAULT 0,
      fee_breakdown TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
    );
  `);

  // Staff table
  db.run(`
    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      staff_type TEXT NOT NULL CHECK (staff_type IN ('office', 'teacher')),
      role TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Teacher assignments table (simplified)
  db.run(`
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      division TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (staff_id) REFERENCES staff (id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE
    );
  `);

  // Transports table (renamed from transport)
  db.run(`
    CREATE TABLE IF NOT EXISTS transports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_name TEXT NOT NULL,
      driver_route TEXT NOT NULL,
      driver_car TEXT NOT NULL,
      driver_car_number TEXT UNIQUE NOT NULL,
      driver_contact TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Fees table
  db.run(`
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      academic_year_id INTEGER,
      amount DECIMAL(10,2) NOT NULL,
      payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'bank')),
      cheque_number TEXT,
      bank_name TEXT,
      payee_name TEXT,
      receipt_number TEXT UNIQUE NOT NULL,
      payment_date DATE NOT NULL,
      month_year TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students (id),
      FOREIGN KEY (branch_id) REFERENCES branches (id),
      FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
    );
  `);

  // Settings table for column management
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      category TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data
  db.get("SELECT COUNT(*) as count FROM branches", (err, row) => {
    if (!err && row && row.count === 0) {
      db.run(
        `INSERT INTO branches (name) VALUES ('Humpty Dumpty Kindergarden')`
      );
      db.run(
        `INSERT INTO branches (name) VALUES ('Humpty Dumpty Charitable Trust')`
      );
    }
  });

  db.get("SELECT COUNT(*) as count FROM academic_years", (err, row) => {
    if (!err && row && row.count === 0) {
      const now = new Date();
      const startYear =
        now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const endYear = startYear + 1;
      const name = `${startYear}-${String(endYear).slice(-2)}`;
      const start_date = `${startYear}-04-01`;
      const end_date = `${endYear}-03-31`;

      db.run(
        `INSERT INTO academic_years (name, start_date, end_date, is_active) VALUES (?, ?, ?, 1)`,
        [name, start_date, end_date]
      );
    }
  });
});

module.exports = db;
