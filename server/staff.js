const db = require("./db");

// Get all staff with their assignments (for teachers)
function getStaff() {
  console.log("[server/staff.js] getStaff() called");
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, contact, staff_type, role FROM staff ORDER BY name`,
      (err, staffList) => {
        if (err) {
          console.error("[server/staff.js] Error fetching staff:", err);
          return reject(err);
        }
        console.log("[server/staff.js] Found staff records:", staffList.length);
        console.log("[server/staff.js] Teachers found:", staffList.filter(s => s.staff_type === "teacher").length);

        // Get teacher assignments
        db.all(
          `SELECT ta.staff_id, ta.class_id, ta.division, c.name as class_name, c.shift_name
           FROM teacher_assignments ta
           LEFT JOIN classes c ON ta.class_id = c.id`,
          (err2, assignments) => {
            if (err2) return reject(err2);

            // Group assignments by staff
            const staffMap = {};
            staffList.forEach((s) => {
              staffMap[s.id] = {
                ...s,
                assignments: [],
              };
            });

            assignments.forEach((a) => {
              if (staffMap[a.staff_id]) {
                staffMap[a.staff_id].assignments.push({
                  class_id: a.class_id,
                  class_name: a.class_name,
                  shift_name: a.shift_name,
                  division: a.division || "",
                });
              }
            });

            const result = Object.values(staffMap);
            console.log("[server/staff.js] Returning staff with assignments:", result.length, "records");
            console.log("[server/staff.js] Teachers with assignments:", result.filter(s => s.staff_type === "teacher").length);
            resolve(result);
          }
        );
      }
    );
  });
}

// Get staff by ID
function getStaffById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, name, contact, staff_type, role FROM staff WHERE id = ?`,
      [id],
      (err, staff) => {
        if (err) return reject(err);
        if (!staff) return resolve(null);

        // Get assignments if teacher
        if (staff.staff_type === "teacher") {
          db.all(
            `SELECT ta.class_id, ta.division, c.name as class_name, c.shift_name
             FROM teacher_assignments ta
             LEFT JOIN classes c ON ta.class_id = c.id
             WHERE ta.staff_id = ?`,
            [id],
            (err2, assignments) => {
              if (err2) return reject(err2);
              staff.assignments = assignments || [];
              resolve(staff);
            }
          );
        } else {
          staff.assignments = [];
          resolve(staff);
        }
      }
    );
  });
}

// Add new staff
function addStaff(staffData) {
  return new Promise((resolve, reject) => {
    const { name, contact, staff_type, role, assignments = [] } = staffData;

    db.run(
      `INSERT INTO staff (name, contact, staff_type, role) VALUES (?, ?, ?, ?)`,
      [name, contact, staff_type, role],
      function (err) {
        if (err) return reject(err);

        const staffId = this.lastID;

        // Add assignments if teacher
        if (staff_type === "teacher" && assignments.length > 0) {
          const insertPromises = assignments.map((assignment) => {
            return new Promise((resolveAssignment, rejectAssignment) => {
              db.run(
                `INSERT INTO teacher_assignments (staff_id, class_id, division) VALUES (?, ?, ?)`,
                [staffId, assignment.class_id, assignment.division || null],
                (assignErr) => {
                  if (assignErr) return rejectAssignment(assignErr);
                  resolveAssignment();
                }
              );
            });
          });

          Promise.all(insertPromises)
            .then(() => resolve({ id: staffId, ...staffData }))
            .catch(reject);
        } else {
          resolve({ id: staffId, ...staffData });
        }
      }
    );
  });
}

// Update staff
function updateStaff(staffData) {
  return new Promise((resolve, reject) => {
    const { id, name, contact, staff_type, role, assignments = [] } = staffData;

    db.run(
      `UPDATE staff SET name = ?, contact = ?, staff_type = ?, role = ? WHERE id = ?`,
      [name, contact, staff_type, role, id],
      (err) => {
        if (err) return reject(err);

        // Delete existing assignments
        db.run(
          `DELETE FROM teacher_assignments WHERE staff_id = ?`,
          [id],
          (deleteErr) => {
            if (deleteErr) return reject(deleteErr);

            // Add new assignments if teacher
            if (staff_type === "teacher" && assignments.length > 0) {
              const insertPromises = assignments.map((assignment) => {
                return new Promise((resolveAssignment, rejectAssignment) => {
                  db.run(
                    `INSERT INTO teacher_assignments (staff_id, class_id, division) VALUES (?, ?, ?)`,
                    [id, assignment.class_id, assignment.division || null],
                    (assignErr) => {
                      if (assignErr) return rejectAssignment(assignErr);
                      resolveAssignment();
                    }
                  );
                });
              });

              Promise.all(insertPromises)
                .then(() => resolve(staffData))
                .catch(reject);
            } else {
              resolve(staffData);
            }
          }
        );
      }
    );
  });
}

// Search staff by name, contact, or role
function searchStaff(query) {
  console.log("[server/staff.js] searchStaff() called with query:", query);
  return new Promise((resolve, reject) => {
    const searchTerm = `%${query}%`;
    db.all(
      `SELECT id, name, contact, staff_type, role FROM staff 
       WHERE name LIKE ? OR contact LIKE ? OR role LIKE ? 
       ORDER BY name`,
      [searchTerm, searchTerm, searchTerm],
      (err, staffList) => {
        if (err) {
          console.error("[server/staff.js] Error in searchStaff:", err);
          return reject(err);
        }
        console.log("[server/staff.js] Found staff records:", staffList.length);

        // Get teacher assignments for search results
        db.all(
          `SELECT ta.staff_id, ta.class_id, ta.division, c.name as class_name, c.shift_name
           FROM teacher_assignments ta
           LEFT JOIN classes c ON ta.class_id = c.id`,
          (err2, assignments) => {
            if (err2) return reject(err2);

            // Group assignments by staff
            const staffMap = {};
            staffList.forEach((s) => {
              staffMap[s.id] = {
                ...s,
                assignments: [],
              };
            });

            assignments.forEach((a) => {
              if (staffMap[a.staff_id]) {
                staffMap[a.staff_id].assignments.push({
                  class_id: a.class_id,
                  class_name: a.class_name,
                  shift_name: a.shift_name,
                  division: a.division || "",
                });
              }
            });

            const result = Object.values(staffMap);
            console.log("[server/staff.js] Returning search results:", result.length, "records");
            resolve(result);
          }
        );
      }
    );
  });
}

// Delete staff
function deleteStaff(id) {
  return new Promise((resolve, reject) => {
    // Delete assignments first (CASCADE should handle this, but being explicit)
    db.run(
      `DELETE FROM teacher_assignments WHERE staff_id = ?`,
      [id],
      (err) => {
        if (err) return reject(err);

        // Delete staff
        db.run(`DELETE FROM staff WHERE id = ?`, [id], (deleteErr) => {
          if (deleteErr) return reject(deleteErr);
          resolve({ success: true });
        });
      }
    );
  });
}

module.exports = {
  getStaff,
  getStaffById,
  addStaff,
  updateStaff,
  searchStaff,
  deleteStaff,
};
