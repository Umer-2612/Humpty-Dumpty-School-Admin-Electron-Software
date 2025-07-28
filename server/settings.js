const db = require("./db");

function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(row ? JSON.parse(row.value) : null);
        } catch (e) {
          resolve(null);
        }
      }
    });
  });
}

function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    const valueStr = JSON.stringify(value);
    db.run(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`,
      [key, valueStr],
      function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}

module.exports = { getSetting, setSetting };
