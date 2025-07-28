const db = require("./db");

// Get all teachers with assigned class and shift info, grouped in JS to avoid SQL cartesian product
function getTeachers() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, contact FROM teachers ORDER BY name`,
      (err, teachers) => {
        if (err) return reject(err);
        db.all(
          `SELECT tcs.teacher_id, c.id as class_id, c.name as class_name, s.id as shift_id, s.name as shift_name, s.time as shift_time
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
              };
            });
            assignments.forEach((a) => {
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
                teacherMap[a.teacher_id].shift_names.push(
                  `${a.shift_name} (${a.shift_time})`
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

// Add a new teacher with class and shift assignments
function addTeacher({ name, contact, classIds = [], shiftIds = [] }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO teachers (name, contact) VALUES (?, ?)`,
      [name, contact],
      function (err) {
        if (err) return reject(err);
        const teacherId = this.lastID;
        // Insert all combinations of classIds and shiftIds
        const assignments = [];
        classIds.forEach((classId) => {
          shiftIds.forEach((shiftId) => {
            assignments.push([teacherId, classId, shiftId]);
          });
        });
        if (assignments.length === 0)
          return resolve({ id: teacherId, name, contact });
        const placeholders = assignments.map(() => "(?, ?, ?)").join(",");
        const flat = assignments.flat();
        db.run(
          `INSERT INTO teacher_class_shift (teacher_id, class_id, shift_id) VALUES ${placeholders}`,
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

// Update a teacher and their assignments
function updateTeacher({ id, name, contact, classIds = [], shiftIds = [] }) {
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
            const assignments = [];
            classIds.forEach((classId) => {
              shiftIds.forEach((shiftId) => {
                assignments.push([id, classId, shiftId]);
              });
            });
            if (assignments.length === 0) return resolve({ id, name, contact });
            const placeholders = assignments.map(() => "(?, ?, ?)").join(",");
            const flat = assignments.flat();
            db.run(
              `INSERT INTO teacher_class_shift (teacher_id, class_id, shift_id) VALUES ${placeholders}`,
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
