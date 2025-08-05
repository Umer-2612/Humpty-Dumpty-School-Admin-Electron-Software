const db = require("./db");

// Get all transport entries
function getTransport() {
  console.log("[server/transport.js] getTransport() called");
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT 
        id,
        driver_name,
        driver_route,
        driver_car,
        driver_car_number,
        driver_contact,
        created_at
      FROM transport
      ORDER BY created_at DESC
    `,
      (err, rows) => {
        if (err) {
          console.error("[server/transport.js] Error fetching transport:", err);
          reject(err);
        } else {
          console.log("[server/transport.js] Transport entries found:", rows.length);
          resolve(rows);
        }
      }
    );
  });
}

// Add a new transport entry
function addTransport(transportData) {
  console.log("[server/transport.js] addTransport() called with:", transportData);
  return new Promise((resolve, reject) => {
    const {
      driver_name,
      driver_route,
      driver_car,
      driver_car_number,
      driver_contact,
    } = transportData;

    // Check for duplicate car number
    db.get(
      `SELECT id FROM transport WHERE driver_car_number = ?`,
      [driver_car_number],
      (err, row) => {
        if (err) {
          console.error(
            "[server/transport.js] Error checking car number:",
            err
          );
          reject(err);
        } else if (row) {
          reject(
            new Error(
              "Car number already exists. Please use a unique car number."
            )
          );
        } else {
          db.run(
            `
            INSERT INTO transport (
              driver_name, driver_route, driver_car, driver_car_number, driver_contact, created_at
            )
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `,
            [
              driver_name,
              driver_route,
              driver_car,
              driver_car_number,
              driver_contact,
            ],
            function (err) {
              if (err) {
                console.error(
                  "[server/transport.js] Error adding transport:",
                  err
                );
                reject(err);
              } else {
                console.log(
                  "[server/transport.js] Transport added with ID:",
                  this.lastID
                );
                resolve({
                  id: this.lastID,
                  driver_name,
                  driver_route,
                  driver_car,
                  driver_car_number,
                  driver_contact,
                });
              }
            }
          );
        }
      }
    );
  });
}

// Update a transport entry
function updateTransport(transportData) {
  console.log("[server/transport.js] updateTransport() called with:", transportData);
  return new Promise((resolve, reject) => {
    const {
      id,
      driver_name,
      driver_route,
      driver_car,
      driver_car_number,
      driver_contact,
    } = transportData;

    // Check for duplicate car number (excluding current entry)
    db.get(
      `SELECT id FROM transport WHERE driver_car_number = ? AND id != ?`,
      [driver_car_number, id],
      (err, row) => {
        if (err) {
          console.error(
            "[server/transport.js] Error checking car number:",
            err
          );
          reject(err);
        } else if (row) {
          reject(
            new Error(
              "Car number already exists. Please use a unique car number."
            )
          );
        } else {
          db.run(
            `
            UPDATE transport SET
              driver_name = ?,
              driver_route = ?,
              driver_car = ?,
              driver_car_number = ?,
              driver_contact = ?
            WHERE id = ?
          `,
            [
              driver_name,
              driver_route,
              driver_car,
              driver_car_number,
              driver_contact,
              id,
            ],
            function (err) {
              if (err) {
                console.error(
                  "[server/transport.js] Error updating transport:",
                  err
                );
                reject(err);
              } else {
                console.log(
                  "[server/transport.js] Transport updated with ID:",
                  id
                );
                resolve({
                  id,
                  driver_name,
                  driver_route,
                  driver_car,
                  driver_car_number,
                  driver_contact,
                });
              }
            }
          );
        }
      }
    );
  });
}

// Delete a transport entry
function deleteTransport(id) {
  console.log("[server/transport.js] deleteTransport() called with id:", id);
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM transport WHERE id = ?`,
      [id],
      function (err) {
        if (err) {
          console.error(
            "[server/transport.js] Error deleting transport:",
            err
          );
          reject(err);
        } else {
          console.log(
            "[server/transport.js] Transport deleted with ID:",
            id,
            "Rows affected:",
            this.changes
          );
          if (this.changes === 0) {
            reject(new Error("Transport entry not found"));
          } else {
            resolve({ success: true, id });
          }
        }
      }
    );
  });
}

module.exports = { getTransport, addTransport, updateTransport, deleteTransport };
