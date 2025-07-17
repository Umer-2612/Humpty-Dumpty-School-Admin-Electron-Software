const db = require("./db");

function getBranches() {
  console.log("[server/branches.js] getBranches() called");
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM branches", [], (err, rows) => {
      if (err) {
        console.error("[server/branches.js] Error fetching branches:", err);
        reject(err);
      } else {
        console.log("[server/branches.js] Branches found:", rows);
        resolve(rows);
      }
    });
  });
}

module.exports = { getBranches };
