const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Determine DB directory
// Prefer Electron's userData (packaged/dev) so DB is writable per user.
// Fallback to the current directory when not running under Electron.
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
const logPath = path.join(dbDir, "db-debug.log");

const log = (msg) => {
  try {
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (_) {}
  try { console.log(msg); } catch(_) {}
};

log(`Database dir: ${dbDir}`);
log(`Database path: ${dbPath}`);

// Create DB file if not exists
try {
  // Ensure parent directory exists
  const parent = path.dirname(dbPath);
  if (!fs.existsSync(parent)) {
    fs.mkdirSync(parent, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, "");
  }
} catch (fsErr) {
  log(`[db.js] Failed to prepare database file/directory: ${fsErr?.message || fsErr}`);
}

let db;
try {
  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
      log(`[db.js] sqlite open error: ${err.message}`);
    } else {
      log(`[db.js] sqlite opened successfully.`);
    }
  });
} catch (openErr) {
  log(`[db.js] Failed to open SQLite database: ${openErr?.message || openErr}`);
  throw openErr;
}

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

  // Divisions: store count on classes table; no separate divisions table

  // Classes table with num_divisions column
  db.run(`
    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      fees TEXT,
      num_divisions INTEGER DEFAULT 0,
      FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
  `);

  // Migration: add num_divisions to existing classes table if missing
  db.get(`PRAGMA table_info(classes);`, (e) => {
    // noop; separate query to check columns
  });
  db.all(`PRAGMA table_info(classes);`, (err, cols) => {
    if (!err && Array.isArray(cols)) {
      const hasNumDivs = cols.some((c) => c.name === "num_divisions");
      if (!hasNumDivs) {
        db.run(
          `ALTER TABLE classes ADD COLUMN num_divisions INTEGER DEFAULT 0;`
        );
      }
    }
  });

  // Students table (new installs): includes division; no admission_end_date; composite uniqueness (roll,class,shift,division)
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      roll_number TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      shift_id INTEGER,
      division TEXT,
      parents_contact1 TEXT,
      parents_contact2 TEXT,
      admission_date TEXT,
      gender TEXT,
      mother_name TEXT,
      father_name TEXT,
      fee_scholarship INTEGER,
      birth_place TEXT,
      religion TEXT,
      address TEXT,
      academic_year_id INTEGER,
      total_fees INTEGER,
      pending_fees INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes (id),
      UNIQUE (roll_number, class_id, shift_id, division)
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

  // Migration: collapse payment types to 'cash' and 'bank', add cheque_date, and allow NULL payee_name
  db.get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='fees'",
    (err, row) => {
      if (err || !row || !row.sql) return;
      const ddl = row.sql;
      const hasBankOnlyConstraint = ddl.includes(
        "CHECK (payment_type IN ('cash', 'bank'))"
      );
      const hasChequeDate = ddl.includes("cheque_date");
      const payeeNotNull = ddl.includes("payee_name TEXT NOT NULL");

      if (!hasBankOnlyConstraint || !hasChequeDate || payeeNotNull) {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          db.run(`
            CREATE TABLE IF NOT EXISTS fees_new_bank (
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
              cheque_date DATE,
              academic_year TEXT,
              month_year TEXT,
              notes TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (student_id) REFERENCES students (id),
              FOREIGN KEY (branch_id) REFERENCES branches (id),
              FOREIGN KEY (academic_year_id) REFERENCES academic_years (id)
            );
          `);
          // Copy data, mapping old types to new
          db.run(`
            INSERT INTO fees_new_bank (
              id, student_id, branch_id, academic_year_id, amount, payment_type, cheque_number, bank_name,
              payee_name, receipt_number, payment_date, cheque_date, academic_year, month_year, notes, created_at
            )
            SELECT 
              id, student_id, branch_id, academic_year_id, amount,
              CASE WHEN payment_type IN ('cheque','upi') THEN 'bank' ELSE 'cash' END as payment_type,
              cheque_number, bank_name, payee_name, receipt_number, payment_date,
              NULL as cheque_date, academic_year, month_year, notes, created_at
            FROM fees;
          `);
          db.run("DROP TABLE fees");
          db.run("ALTER TABLE fees_new_bank RENAME TO fees");
          db.run("COMMIT");
        });
      } else if (!hasChequeDate) {
        // simple add if constraint already correct and only column missing
        db.run(`ALTER TABLE fees ADD COLUMN cheque_date DATE`);
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

  // Migration: add fee_term and fee_charge to fees if missing (for term/charge allocation)
  db.all("PRAGMA table_info(fees)", (err, columns) => {
    if (err || !columns) return;
    const colNames = columns.map((c) => c.name);
    if (!colNames.includes("fee_term")) {
      db.run(`ALTER TABLE fees ADD COLUMN fee_term TEXT`);
    }
    if (!colNames.includes("fee_charge")) {
      db.run(`ALTER TABLE fees ADD COLUMN fee_charge TEXT`);
    }
  });

  // Migration: Rebuild students table if it has admission_end_date, lacks division, or wrong UNIQUE
  db.get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='students'",
    (err, result) => {
      if (err || !result || !result.sql) return; // can't inspect
      const ddl = result.sql;
      const hasAdmissionEnd = ddl.includes("admission_end_date");
      const hasDivision = ddl.includes("division");
      const hasCompositeUnique = ddl.includes(
        "UNIQUE (roll_number, class_id, shift_id, division)"
      );
      if (hasAdmissionEnd || !hasDivision || !hasCompositeUnique) {
        console.log(
          "[db.js] Migrating students table to add division, drop admission_end_date, and set composite UNIQUE..."
        );
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");
          db.run(
            `CREATE TABLE IF NOT EXISTS students_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            roll_number TEXT NOT NULL,
            class_id INTEGER NOT NULL,
            shift_id INTEGER,
            division TEXT,
            parents_contact1 TEXT,
            parents_contact2 TEXT,
            admission_date TEXT,
            gender TEXT,
            mother_name TEXT,
            father_name TEXT,
            fee_scholarship INTEGER,
            birth_place TEXT,
            religion TEXT,
            address TEXT,
            academic_year_id INTEGER,
            total_fees INTEGER,
            pending_fees INTEGER,
            fee_breakdown TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes (id),
            UNIQUE (roll_number, class_id, shift_id, division)
          );`
          );
          // Ensure extra columns exist on old table before copy
          db.all("PRAGMA table_info(students)", (e, cols) => {
            if (e) {
              console.error("[db.js] Failed to inspect old students table:", e);
            }
            // Copy by explicit column list (ignoring admission_end_date)
            db.run(
              `INSERT INTO students_new (
              id, name, roll_number, class_id, shift_id, division, parents_contact1, parents_contact2, admission_date,
              gender, mother_name, father_name, fee_scholarship, birth_place, religion, address,
              academic_year_id, total_fees, pending_fees, fee_breakdown, created_at
            )
            SELECT 
              id, name, roll_number, class_id, shift_id, NULL as division, parents_contact1, parents_contact2, admission_date,
              gender, mother_name, father_name, fee_scholarship, birth_place, religion, address,
              academic_year_id, total_fees, pending_fees, NULL as fee_breakdown, created_at
            FROM students;`,
              (copyErr) => {
                if (copyErr) {
                  console.error(
                    "[db.js] Error copying data to students_new:",
                    copyErr
                  );
                  db.run("ROLLBACK");
                  return;
                }
                db.run(`DROP TABLE students`, (dropErr) => {
                  if (dropErr) {
                    console.error(
                      "[db.js] Error dropping old students table:",
                      dropErr
                    );
                    db.run("ROLLBACK");
                    return;
                  }
                  db.run(
                    `ALTER TABLE students_new RENAME TO students`,
                    (renameErr) => {
                      if (renameErr) {
                        console.error(
                          "[db.js] Error renaming students_new:",
                          renameErr
                        );
                        db.run("ROLLBACK");
                        return;
                      }
                      db.run("COMMIT");
                      console.log(
                        "[db.js] Students table migrated successfully."
                      );
                    }
                  );
                });
              }
            );
          });
        });
      }
    }
  );

  // Migration: ensure fee_breakdown column exists on students for existing correct schema
  db.all("PRAGMA table_info(students)", (err, columns) => {
    if (err || !columns) return;
    const names = columns.map((c) => c.name);
    if (!names.includes("fee_breakdown")) {
      db.run(`ALTER TABLE students ADD COLUMN fee_breakdown TEXT`);
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

  // Unified Class Entries table (replaces separate classes + class_shifts usage in UI)
  // Stores: branch, class name, shift name, optional times, fees(JSON), and division_count
  db.run(`
    CREATE TABLE IF NOT EXISTS class_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      class_id INTEGER,
      shift_id INTEGER,
      class_name TEXT NOT NULL,
      shift_name TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      fees TEXT,
      division_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches (id)
    );
  `);

  // Backfill class_entries from existing classes x class_shifts if class_entries is empty
  db.get("SELECT COUNT(*) as cnt FROM class_entries", (err, row) => {
    if (err) {
      console.warn("[db.js] Failed to count class_entries:", err);
      return;
    }
    if (row && row.cnt === 0) {
      // Load shifts and classes, then create cartesian insert
      db.all("SELECT id, name, start_time, end_time FROM class_shifts", (e1, shifts) => {
        if (e1) {
          console.warn("[db.js] Failed to read class_shifts for backfill:", e1);
          return;
        }
        db.all("SELECT id, branch_id, name, fees, num_divisions FROM classes", (e2, classes) => {
          if (e2) {
            console.warn("[db.js] Failed to read classes for backfill:", e2);
            return;
          }
          if (!Array.isArray(classes) || classes.length === 0) return;
          // If there are no shifts yet, still create entries with a default shift name
          const useShifts = Array.isArray(shifts) && shifts.length ? shifts : [{ name: 'Default', start_time: null, end_time: null }];
          db.serialize(() => {
            const stmt = db.prepare(`
              INSERT INTO class_entries (branch_id, class_id, shift_id, class_name, shift_name, start_time, end_time, fees, division_count)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            try {
              classes.forEach((c) => {
                const divs = Math.max(0, Number(c.num_divisions) || 0);
                const fees = c.fees || null;
                useShifts.forEach((s) => {
                  stmt.run(
                    c.branch_id,
                    c.id,
                    s.id || null,
                    c.name,
                    s.name,
                    s.start_time || null,
                    s.end_time || null,
                    fees,
                    divs
                  );
                });
              });
            } catch (insErr) {
              console.warn("[db.js] Error backfilling class_entries:", insErr);
            } finally {
              try { stmt.finalize(); } catch(_) {}
            }
          });
        });
      });
    }
  });

  // Class Shifts table (start_time/end_time in AM/PM format)
  db.run(`
    CREATE TABLE IF NOT EXISTS class_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT
    );
  `);

  // Migration: add start_time/end_time if the table exists with legacy 'time' column
  db.all(`PRAGMA table_info(class_shifts);`, (err, columns) => {
    if (err) {
      console.error("[db] Failed to inspect class_shifts table:", err);
      return;
    }
    const colNames = (columns || []).map((c) => c.name);
    const hasLegacyTime = colNames.includes("time");
    const hasStart = colNames.includes("start_time");
    const hasEnd = colNames.includes("end_time");

    const addCols = [];
    if (!hasStart)
      addCols.push(`ALTER TABLE class_shifts ADD COLUMN start_time TEXT`);
    if (!hasEnd)
      addCols.push(`ALTER TABLE class_shifts ADD COLUMN end_time TEXT`);
    if (addCols.length) {
      addCols.forEach((sql) => db.run(sql));
    }

    // If legacy 'time' exists and start_time is null, migrate values to start_time
    if (hasLegacyTime) {
      db.run(`UPDATE class_shifts SET start_time = COALESCE(start_time, time)`);
    }
  });

  // Join table for teacher-class-shift assignments
  db.run(`
    CREATE TABLE IF NOT EXISTS teacher_class_shift (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      shift_id INTEGER NOT NULL,
      division TEXT,
      FOREIGN KEY (teacher_id) REFERENCES teachers (id),
      FOREIGN KEY (class_id) REFERENCES classes (id),
      FOREIGN KEY (shift_id) REFERENCES class_shifts (id)
    );
  `);

  // Ensure 'division' column exists on teacher_class_shift for legacy databases
  db.all(`PRAGMA table_info(teacher_class_shift)`, (err, rows) => {
    if (err) return;
    const colNames = Array.isArray(rows) ? rows.map((r) => r.name) : [];
    if (!colNames.includes("division")) {
      db.run(`ALTER TABLE teacher_class_shift ADD COLUMN division TEXT`);
    }
  });

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
        `INSERT INTO class_shifts (name, start_time, end_time) VALUES ('Morning', '08:00', '12:00')`
      );
      db.run(
        `INSERT INTO class_shifts (name, start_time, end_time) VALUES ('Afternoon', '12:00', '16:00')`
      );
    }
  });

  // Seed classes if empty (attach to branches by name, not hard-coded IDs)
  db.get("SELECT COUNT(*) as count FROM classes", (err, row) => {
    if (row.count === 0) {
      // Fees templates (kept for compatibility; values are placeholders)
      const dayCareFees = JSON.stringify({ term1: 9000, term2: 9000 });
      const juniorKgFees = JSON.stringify({ term1: 10000, term2: 10000 });
      const seniorKgFees = JSON.stringify({ term1: 11000, term2: 11000 });
      const balVatikaFees = JSON.stringify({ term1: 12000, term2: 12000 });

      // Insert Day Care + Junior Kg under 'Humpty Dumpty Kindergarden'
      db.run(
        `INSERT INTO classes (branch_id, name, fees, num_divisions)
         SELECT id, 'Day Care', ?, 4 FROM branches WHERE name = 'Humpty Dumpty Kindergarden'`
        , dayCareFees
      );
      db.run(
        `INSERT INTO classes (branch_id, name, fees, num_divisions)
         SELECT id, 'Junior Kg', ?, 4 FROM branches WHERE name = 'Humpty Dumpty Kindergarden'`
        , juniorKgFees
      );

      // Insert Senior Kg + Bal Vatika under 'Humpty Dumpty Charitable Trust'
      db.run(
        `INSERT INTO classes (branch_id, name, fees, num_divisions)
         SELECT id, 'Senior Kg', ?, 4 FROM branches WHERE name = 'Humpty Dumpty Charitable Trust'`
        , seniorKgFees
      );
      db.run(
        `INSERT INTO classes (branch_id, name, fees, num_divisions)
         SELECT id, 'Bal Vatika', ?, 4 FROM branches WHERE name = 'Humpty Dumpty Charitable Trust'`
        , balVatikaFees
      );
    }
  });

  // NOTE: Disabled auto-correction of classes to avoid overriding user customizations.
  // If remapping is ever needed, it should be done explicitly via an admin action, not at startup.

  // NOTE: Disabled re-insertion of missing default classes. Respect manual class setup.

  // NOTE: Disabled enforcing shift times and division counts globally.

  // NOTE: Disabled auto-creation of class_entries rows. Manage via UI or explicit actions instead.

  // Cleanup: remove any legacy 'Default' shift artifacts
  // - Delete class_entries created earlier with placeholder 'Default' shift
  // - Remove 'Default' shift from class_shifts so UI doesn't pick it up
  db.run(`DELETE FROM class_entries WHERE shift_name = 'Default'`);
  db.run(`DELETE FROM class_shifts WHERE name = 'Default'`);

  // Ensure Charitable Trust classes have 4 divisions
  db.run(`
    UPDATE classes
    SET num_divisions = 4
    WHERE id IN (
      SELECT c.id FROM classes c
      JOIN branches b ON b.id = c.branch_id
      WHERE b.name = 'Humpty Dumpty Charitable Trust'
        AND c.name IN ('Senior Kg','Bal Vatika')
    );
  `);

  // Sync existing class_entries division_count to 4 for Charitable Trust Senior Kg & Bal Vatika
  db.run(`
    UPDATE class_entries
    SET division_count = 4
    WHERE branch_id IN (SELECT id FROM branches WHERE name = 'Humpty Dumpty Charitable Trust')
      AND class_name IN ('Senior Kg','Bal Vatika');
  `);

  // Simple insert-only backfill: add 4 entries per branch if missing (no deletes)
  // Day Care & Junior Kg (Kindergarden) x [Morning, Afternoon]
  // Senior Kg & Bal Vatika (Charitable Trust) x [Morning, Afternoon]
  db.serialize(() => {
    const ensureEntriesSQL = `
      INSERT INTO class_entries (
        branch_id, class_id, shift_id, class_name, shift_name, start_time, end_time, fees, division_count
      )
      SELECT 
        c.branch_id,
        c.id as class_id,
        s.id as shift_id,
        c.name as class_name,
        s.name as shift_name,
        s.start_time,
        s.end_time,
        c.fees,
        c.num_divisions as division_count
      FROM classes c
      JOIN branches b ON b.id = c.branch_id
      JOIN class_shifts s ON s.name IN ('Morning','Afternoon')
      WHERE (
        (b.name = 'Humpty Dumpty Kindergarden' AND c.name IN ('Day Care','Junior Kg'))
        OR
        (b.name = 'Humpty Dumpty Charitable Trust' AND c.name IN ('Senior Kg','Bal Vatika'))
      )
      AND NOT EXISTS (
        SELECT 1 FROM class_entries ce
        WHERE ce.branch_id = c.branch_id
          AND ce.class_name = c.name
          AND ce.shift_name = s.name
      );
    `;
    db.run(ensureEntriesSQL);
  });
});

module.exports = db;
