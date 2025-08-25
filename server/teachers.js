const db = require("./db");

// Get all teachers with assigned class/shift/division info, grouped in JS to avoid SQL cartesian product
function getTeachers() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, contact FROM teachers ORDER BY name`,
      (err, teachers) => {
        if (err) return reject(err);
        db.all(
          `SELECT tcs.teacher_id,
                  c.id as class_id,
                  c.name as class_name,
                  s.id as shift_id,
                  s.name as shift_name,
                  s.start_time as start_time,
                  s.end_time as end_time,
                  tcs.division as division
           FROM teacher_class_shift tcs
           LEFT JOIN classes c ON tcs.class_id = c.id
           LEFT JOIN class_shifts s ON tcs.shift_id = s.id`,
          (err2, assignments) => {
            if (err2) return reject(err2);
            // Group assignments by teacher
            const teacherMap = {};
            teachers.forEach((t) => {
              teacherMap[t.id] = {
                id: t.id,
                name: t.name,
                contact: t.contact,
                class_names: [],
                class_ids: [],
                shift_names: [],
                shift_ids: [],
                assignments: [], // { class_id, class_name, division, shift_id, shift_name, start_time, end_time }
              };
            });
            assignments.forEach((a) => {
              if (!teacherMap[a.teacher_id]) return;
              // Push full assignment row (may include null division)
              teacherMap[a.teacher_id].assignments.push({
                class_id: a.class_id,
                class_name: a.class_name,
                division: a.division || "",
                shift_id: a.shift_id,
                shift_name: a.shift_name,
                start_time: a.start_time,
                end_time: a.end_time,
              });
              if (
                a.class_id &&
                !teacherMap[a.teacher_id].class_ids.includes(
                  a.class_id.toString()
                )
              ) {
                teacherMap[a.teacher_id].class_ids.push(a.class_id.toString());
                teacherMap[a.teacher_id].class_names.push(a.class_name);
              }
              if (
                a.shift_id &&
                !teacherMap[a.teacher_id].shift_ids.includes(
                  a.shift_id.toString()
                )
              ) {
                teacherMap[a.teacher_id].shift_ids.push(a.shift_id.toString());
                const timeStr =
                  a.start_time && a.end_time
                    ? `${a.start_time} - ${a.end_time}`
                    : a.start_time || a.end_time || "-";
                teacherMap[a.teacher_id].shift_names.push(
                  `${a.shift_name} (${timeStr})`
                );
              }
            });
            resolve(Object.values(teacherMap));
          }
        );
      }
    );
  });
}

// Add a new teacher with assignments (supports legacy classIds/shiftIds)
function addTeacher({ name, contact, classIds = [], shiftIds = [], assignments = [] }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO teachers (name, contact) VALUES (?, ?)`,
      [name, contact],
      function (err) {
        if (err) return reject(err);
        const teacherId = this.lastID;
        let rows = [];
        if (Array.isArray(assignments) && assignments.length) {
          // Use provided assignments with division support
          rows = assignments.map((a) => [
            teacherId,
            a.classId,
            a.shiftId,
            a.division || "",
          ]);
        } else {
          // Legacy path: all combinations of classIds and shiftIds without division
          classIds.forEach((classId) => {
            shiftIds.forEach((shiftId) => {
              rows.push([teacherId, classId, shiftId, ""]);
            });
          });
        }
        if (rows.length === 0)
          return resolve({ id: teacherId, name, contact });
        const placeholders = rows.map(() => "(?, ?, ?, ?)").join(",");
        const flat = rows.flat();
        db.run(
          `INSERT INTO teacher_class_shift (teacher_id, class_id, shift_id, division) VALUES ${placeholders}`,
          flat,
          function (err2) {
            if (err2) return reject(err2);
            resolve({ id: teacherId, name, contact });
          }
        );
      }
    );
  });
}

// Update a teacher and their assignments (supports legacy classIds/shiftIds)
function updateTeacher({ id, name, contact, classIds = [], shiftIds = [], assignments = [] }) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE teachers SET name = ?, contact = ? WHERE id = ?`,
      [name, contact, id],
      function (err) {
        if (err) return reject(err);
        // Remove old assignments
        db.run(
          `DELETE FROM teacher_class_shift WHERE teacher_id = ?`,
          [id],
          function (err2) {
            if (err2) return reject(err2);
            // Insert new assignments
            let rows = [];
            if (Array.isArray(assignments) && assignments.length) {
              rows = assignments.map((a) => [id, a.classId, a.shiftId, a.division || ""]);
            } else {
              classIds.forEach((classId) => {
                shiftIds.forEach((shiftId) => {
                  rows.push([id, classId, shiftId, ""]);
                });
              });
            }
            if (rows.length === 0) return resolve({ id, name, contact });
            const placeholders = rows.map(() => "(?, ?, ?, ?)" ).join(",");
            const flat = rows.flat();
            db.run(
              `INSERT INTO teacher_class_shift (teacher_id, class_id, shift_id, division) VALUES ${placeholders}`,
              flat,
              function (err3) {
                if (err3) return reject(err3);
                resolve({ id, name, contact });
              }
            );
          }
        );
      }
    );
  });
}

// Delete a teacher
function deleteTeacher(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM teachers WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve({ id });
    });
  });
}

module.exports = { getTeachers, addTeacher, updateTeacher, deleteTeacher };
