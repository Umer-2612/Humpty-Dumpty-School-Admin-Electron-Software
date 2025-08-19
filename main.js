const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { getBranches } = require("./server/branches");
const {
  getStudents,
  searchStudents,
  addStudent,
  getClasses,
  getNextRollNumber,
  updateStudent,
  deleteStudent,
  getStudentById,
} = require("./server/students");
const {
  getClassesByBranch,
  addClass,
  updateClass,
  deleteClass,
} = require("./server/classes");
const { getSetting, setSetting } = require("./server/settings");
const {
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
} = require("./server/teachers");
const {
  getTransport,
  addTransport,
  updateTransport,
  deleteTransport,
} = require("./server/transport");
const {
  getFees,
  addFees,
  updateFees,
  deleteFees,
  getStudentsForFees,
  getFeesReceipt,
  getNextReceiptNumber,
  getStudentTermSummary,
} = require("./server/fees");
const {
  getClassShifts,
  addClassShift,
  updateClassShift,
  deleteClassShift,
} = require("./server/class_shifts");
const {
  listAcademicYears,
  addAcademicYear,
  updateAcademicYear,
  setActiveAcademicYear,
  getActiveAcademicYear,
} = require("./server/academic_years");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

ipcMain.handle("get-student-by-id", async (event, id) => {
  try {
    return await getStudentById(id);
  } catch (error) {
    console.error("[main.js] Error in 'get-student-by-id' handler:", error);
    return null;
  }
});

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, "client/dist/index.html")}`
    : "http://localhost:5173";

  win.loadURL(startURL);
}

app.whenReady().then(() => {
  createWindow();
});

// Academic Years IPC handlers (top-level)
ipcMain.handle("list-academic-years", async () => {
  try {
    return await listAcademicYears();
  } catch (error) {
    console.error("[main.js] Error in 'list-academic-years':", error);
    return [];
  }
});
ipcMain.handle("add-academic-year", async (event, payload) => {
  try {
    return await addAcademicYear(payload);
  } catch (error) {
    console.error("[main.js] Error in 'add-academic-year':", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("update-academic-year", async (event, payload) => {
  try {
    return await updateAcademicYear(payload);
  } catch (error) {
    console.error("[main.js] Error in 'update-academic-year':", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("set-active-academic-year", async (event, id) => {
  try {
    return await setActiveAcademicYear(id);
  } catch (error) {
    console.error("[main.js] Error in 'set-active-academic-year':", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("get-active-academic-year", async () => {
  try {
    return await getActiveAcademicYear();
  } catch (error) {
    console.error("[main.js] Error in 'get-active-academic-year':", error);
    return null;
  }
});

// IPC handlers
ipcMain.handle("get-branches", async () => {
  console.log("[main.js] IPC handler 'get-branches' invoked.");
  try {
    const branches = await getBranches(); // from SQLite
    console.log("[main.js] Sending branches to renderer:", branches);
    return branches;
  } catch (error) {
    console.error("[main.js] Error in 'get-branches' handler:", error);
    return []; // Return empty array on error
  }
});

ipcMain.handle("get-students", async (event, branch_id, academicYearId = null) => {
  console.log("[main.js] IPC handler 'get-students' invoked.", branch_id, academicYearId);
  try {
    const students = await getStudents(branch_id, academicYearId);
    return students;
  } catch (error) {
    console.error("[main.js] Error in 'get-students' handler:", error);
    return [];
  }
});

ipcMain.handle("search-students", async (event, branch_id, query, academicYearId = null) => {
  console.log("[main.js] IPC handler 'search-students' invoked.", branch_id, query, academicYearId);
  try {
    const students = await searchStudents(branch_id, query, academicYearId);
    return students;
  } catch (error) {
    console.error("[main.js] Error in 'search-students' handler:", error);
    return [];
  }
});

ipcMain.handle("get-next-roll-number", async (event, classId, shiftId, division) => {
  console.log("[main.js] IPC handler 'get-next-roll-number' invoked.", { classId, shiftId, division });
  try {
    const next = await getNextRollNumber(classId, shiftId, division);
    return { success: true, next };
  } catch (error) {
    console.error("[main.js] Error in 'get-next-roll-number' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("add-student", async (event, studentData) => {
  console.log("[main.js] IPC handler 'add-student' invoked.", studentData);
  try {
    const result = await addStudent(studentData);
    return { success: true, student: result };
  } catch (error) {
    console.error("[main.js] Error in 'add-student' handler:", error);
    return { success: false, error: error.message || "Failed to add student" };
  }
});

ipcMain.handle("update-student", async (event, studentData) => {
  console.log("[main.js] IPC handler 'update-student' invoked.", studentData);
  try {
    const result = await updateStudent(studentData);
    return { success: true, student: result };
  } catch (error) {
    console.error("[main.js] Error in 'update-student' handler:", error);
    return {
      success: false,
      error: error.message || "Failed to update student",
    };
  }
});

ipcMain.handle("delete-student", async (event, id) => {
  console.log("🔵 [BACKEND] main.js: IPC handler 'delete-student' invoked with ID:", id);
  console.log("🔵 [BACKEND] main.js: ID type:", typeof id);
  console.log("🔵 [BACKEND] main.js: ID value:", JSON.stringify(id));
  
  try {
    console.log("🔵 [BACKEND] main.js: Calling deleteStudent function...");
    const result = await deleteStudent(id);
    console.log("🔵 [BACKEND] main.js: deleteStudent result:", result);
    console.log("🔵 [BACKEND] main.js: Returning success response");
    return { success: true, id: result.id };
  } catch (error) {
    console.error("🔵 [BACKEND] main.js: Error in 'delete-student' handler:", error);
    console.error("🔵 [BACKEND] main.js: Error message:", error.message);
    console.error("🔵 [BACKEND] main.js: Error stack:", error.stack);
    return {
      success: false,
      error: error.message || "Failed to delete student",
    };
  }
});

ipcMain.handle("get-classes", async () => {
  try {
    return await getClasses();
  } catch (error) {
    console.error("[main.js] Error in 'get-classes' handler:", error);
    return [];
  }
});

ipcMain.handle("get-classes-by-branch", async (event, branch_id) => {
  console.log(
    "[main.js] IPC handler 'get-classes-by-branch' invoked.",
    branch_id
  );
  try {
    const classes = await getClassesByBranch(branch_id);
    return classes;
  } catch (error) {
    console.error("[main.js] Error in 'get-classes-by-branch' handler:", error);
    return [];
  }
});

ipcMain.handle("add-class", async (event, classData) => {
  console.log("[main.js] IPC handler 'add-class' invoked.", classData);
  try {
    const result = await addClass(classData);
    return { success: true, ...result };
  } catch (error) {
    console.error("[main.js] Error in 'add-class' handler:", error);
    return { success: false, error: error.message || "Failed to add class" };
  }
});

ipcMain.handle("update-class", async (event, classData) => {
  console.log("[main.js] IPC handler 'update-class' invoked.", classData);
  try {
    const result = await updateClass(classData);
    return { success: true, ...result };
  } catch (error) {
    console.error("[main.js] Error in 'update-class' handler:", error);
    return { success: false, error: error.message || "Failed to update class" };
  }
});

ipcMain.handle("delete-class", async (event, id) => {
  console.log("[main.js] IPC handler 'delete-class' invoked.", id);
  try {
    const result = await deleteClass(id);
    return { success: true, class: result };
  } catch (error) {
    console.error("[main.js] Error in 'delete-class' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-setting", async (event, key) => {
  try {
    return await getSetting(key);
  } catch (error) {
    console.error("[main.js] Error in 'get-setting' handler:", error);
    return null;
  }
});
ipcMain.handle("set-setting", async (event, key, value) => {
  try {
    await setSetting(key, value);
    return { success: true };
  } catch (error) {
    console.error("[main.js] Error in 'set-setting' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-teachers", async () => {
  try {
    return await getTeachers();
  } catch (error) {
    console.error("[main.js] Error in 'get-teachers' handler:", error);
    return [];
  }
});
ipcMain.handle("add-teacher", async (event, teacherData) => {
  try {
    const result = await addTeacher(teacherData);
    return { success: true, teacher: result };
  } catch (error) {
    console.error("[main.js] Error in 'add-teacher' handler:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("update-teacher", async (event, teacherData) => {
  try {
    const result = await updateTeacher(teacherData);
    return { success: true, teacher: result };
  } catch (error) {
    console.error("[main.js] Error in 'update-teacher' handler:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("delete-teacher", async (event, id) => {
  try {
    const result = await deleteTeacher(id);
    return { success: true, teacher: result };
  } catch (error) {
    console.error("[main.js] Error in 'delete-teacher' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-class-shifts", async () => {
  try {
    return await getClassShifts();
  } catch (error) {
    console.error("[main.js] Error in 'get-class-shifts' handler:", error);
    return [];
  }
});
ipcMain.handle("add-class-shift", async (event, shiftData) => {
  try {
    const result = await addClassShift(shiftData);
    return { success: true, shift: result };
  } catch (error) {
    console.error("[main.js] Error in 'add-class-shift' handler:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("update-class-shift", async (event, shiftData) => {
  try {
    const result = await updateClassShift(shiftData);
    return { success: true, shift: result };
  } catch (error) {
    console.error("[main.js] Error in 'update-class-shift' handler:", error);
    return { success: false, error: error.message };
  }
});
ipcMain.handle("delete-class-shift", async (event, id) => {
  try {
    const result = await deleteClassShift(id);
    return { success: true, shift: result };
  } catch (error) {
    console.error("[main.js] Error in 'delete-class-shift' handler:", error);
    return { success: false, error: error.message };
  }
});

// Transport IPC handlers
ipcMain.handle("get-transport", async () => {
  try {
    return await getTransport();
  } catch (error) {
    console.error("[main.js] Error in 'get-transport' handler:", error);
    return [];
  }
});

ipcMain.handle("add-transport", async (event, transportData) => {
  try {
    const result = await addTransport(transportData);
    return { success: true, transport: result };
  } catch (error) {
    console.error("[main.js] Error in 'add-transport' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("update-transport", async (event, transportData) => {
  try {
    const result = await updateTransport(transportData);
    return { success: true, transport: result };
  } catch (error) {
    console.error("[main.js] Error in 'update-transport' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-transport", async (event, id) => {
  try {
    const result = await deleteTransport(id);
    return { success: true, id: result.id };
  } catch (error) {
    console.error("[main.js] Error in 'delete-transport' handler:", error);
    return { success: false, error: error.message };
  }
});

// Fees IPC handlers
ipcMain.handle("get-fees", async (event, branchId, academicYearId = null) => {
  return new Promise((resolve) => {
    getFees(branchId, academicYearId, (err, fees) => {
      if (err) {
        console.error("[main.js] Error in 'get-fees' handler:", err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, fees });
      }
    });
  });
});

ipcMain.handle("get-next-receipt-number", async (event, paymentType) => {
  return new Promise((resolve) => {
    try {
      const type = paymentType === 'cash' ? 'cash' : 'bank';
      getNextReceiptNumber(type, (err, next) => {
        if (err) {
          console.error("[main.js] Error in 'get-next-receipt-number':", err);
          resolve({ success: false, error: err.message || 'Failed to get next receipt number' });
        } else {
          resolve({ success: true, next });
        }
      });
    } catch (error) {
      console.error("[main.js] Exception in 'get-next-receipt-number':", error);
      resolve({ success: false, error: error.message || 'Failed to get next receipt number' });
    }
  });
});

ipcMain.handle("add-fees", async (event, feesData) => {
  return new Promise((resolve) => {
    addFees(feesData, (err, result) => {
      if (err) {
        console.error("[main.js] Error in 'add-fees' handler:", err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, id: result.id, receipt_number: result.receipt_number });
      }
    });
  });
});

ipcMain.handle("update-fees", async (event, feesData) => {
  return new Promise((resolve) => {
    updateFees(feesData.id, feesData, (err, result) => {
      if (err) {
        console.error("[main.js] Error in 'update-fees' handler:", err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, changes: result.changes });
      }
    });
  });
});

ipcMain.handle("delete-fees", async (event, id) => {
  return new Promise((resolve) => {
    deleteFees(id, (err, result) => {
      if (err) {
        console.error("[main.js] Error in 'delete-fees' handler:", err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, changes: result.changes });
      }
    });
  });
});

ipcMain.handle("get-students-for-fees", async (event, branchId, academicYearId = null) => {
  return new Promise((resolve) => {
    getStudentsForFees(branchId, academicYearId, (err, students) => {
      if (err) {
        console.error("[main.js] Error in 'get-students-for-fees' handler:", err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, students });
      }
    });
  });
});

ipcMain.handle("get-fees-receipt", async (event, receiptNumber) => {
  return new Promise((resolve) => {
    getFeesReceipt(receiptNumber, (err, receipt) => {
      if (err) {
        console.error("[main.js] Error in 'get-fees-receipt' handler:", err);
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, receipt });
      }
    });
  });
});

ipcMain.handle(
  "get-student-term-summary",
  async (event, studentId, academicYearId = null) => {
    return new Promise((resolve) => {
      try {
        getStudentTermSummary(studentId, academicYearId, (err, summary) => {
          if (err) {
            console.error(
              "[main.js] Error in 'get-student-term-summary' handler:",
              err
            );
            resolve({ success: false, error: err.message });
          } else {
            resolve({ success: true, summary });
          }
        });
      } catch (e) {
        console.error(
          "[main.js] Exception in 'get-student-term-summary' handler:",
          e
        );
        resolve({ success: false, error: e.message });
      }
    });
  }
);
