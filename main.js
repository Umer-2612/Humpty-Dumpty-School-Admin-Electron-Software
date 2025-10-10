const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
// Defer requiring backend modules until app is ready so db.js can resolve userData path
let getBranches,
  addBranch,
  updateBranch,
  deleteBranch;
let getStudents,
  getStudentsByTeacher,
  searchStudents,
  addStudent,
  getClasses,
  getNextRollNumber,
  getNextRollNumberByEntry,
  updateStudent,
  deleteStudent,
  getStudentById;
let getSetting, setSetting;
let getStaff, addStaff, updateStaff, deleteStaff, getStaffById, searchStaff;
let getTransport, addTransport, updateTransport, deleteTransport;
let getFees,
  addFees,
  updateFees,
  deleteFees,
  getStudentsForFees,
  getFeesReceipt,
  getNextReceiptNumber,
  getStudentTermSummary,
  getStudentMonthsStatus;
// Class shifts not needed
let listClassesByBranch, addClass, updateClass, deleteClass;
let listAcademicYears,
  addAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  setActiveAcademicYear,
  getActiveAcademicYear;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Unified Classes IPC handlers
  ipcMain.handle("list-classes-by-branch", async (event, branch_id) => {
    try {
      return await listClassesByBranch(branch_id);
    } catch (error) {
      console.error("[main.js] Error in 'list-classes-by-branch':", error);
      return [];
    }
  });

  ipcMain.handle("add-class", async (event, payload) => {
    try {
      const result = await addClass(payload);
      return { success: true, entry: result };
    } catch (error) {
      console.error("[main.js] Error in 'add-class':", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("update-class", async (event, payload) => {
    try {
      const result = await updateClass(payload);
      return { success: true, entry: result };
    } catch (error) {
      console.error("[main.js] Error in 'update-class':", error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle("delete-class", async (event, id) => {
    try {
      const result = await deleteClass(id);
      return { success: true, id: result.id };
    } catch (error) {
      console.error("[main.js] Error in 'delete-class':", error);
      return { success: false, error: error.message };
    }
  });

  // Utility: Save HTML content directly as PDF using printToPDF
  ipcMain.handle("save-student-report-pdf", async (event, payload) => {
    const { html, defaultPath } = payload || {};
    if (!html || typeof html !== "string") {
      return { success: false, error: "No HTML content provided" };
    }
    let pdfWin;
    try {
      pdfWin = new BrowserWindow({
        show: false,
        webPreferences: {
          contextIsolation: true,
          sandbox: true,
        },
      });
      const dataUrl =
        "data:text/html;charset=utf-8," + encodeURIComponent(html);
      await pdfWin.loadURL(dataUrl);
      const pdf = await pdfWin.webContents.printToPDF({
        marginsType: 1,
        pageSize: "A4",
        printBackground: true,
        landscape: false,
      });

      const win = BrowserWindow.getFocusedWindow();
      const { canceled, filePath } = await dialog.showSaveDialog(win || null, {
        title: "Save Student Report PDF",
        defaultPath: defaultPath || "student-report.pdf",
        filters: [
          { name: "PDF", extensions: ["pdf"] },
          { name: "All Files", extensions: ["*"] },
        ],
      });
      if (canceled || !filePath) {
        return { success: false, canceled: true };
      }
      await fs.promises.writeFile(filePath, pdf);
      return { success: true, path: filePath };
    } catch (error) {
      console.error("[main.js] Error in 'save-student-report-pdf':", error);
      return { success: false, error: error.message };
    } finally {
      if (pdfWin) pdfWin.destroy();
    }
  });

  ipcMain.handle("get-student-by-id", async (event, id) => {
    try {
      return await getStudentById(id);
    } catch (error) {
      console.error("[main.js] Error in 'get-student-by-id' handler:", error);
      return null;
    }
  });

  // Academic Years IPC handlers
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

  ipcMain.handle("delete-academic-year", async (event, id) => {
    try {
      return await deleteAcademicYear(id);
    } catch (error) {
      console.error("[main.js] Error in 'delete-academic-year':", error);
      return { success: false, error: error.message };
    }
  });

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, "client/dist/index.html")}`
    : "http://localhost:5173";

  win.loadURL(startURL);
}

app.whenReady().then(() => {
  try {
    ({ getBranches, addBranch, updateBranch, deleteBranch } = require("./server/branches"));
    ({
      getStudents,
      getStudentsByTeacher,
      searchStudents,
      addStudent,
      getClasses,
      getNextRollNumber,
      getNextRollNumberByEntry,
      updateStudent,
      deleteStudent,
      getStudentById,
    } = require("./server/students"));
    ({
      listClassesByBranch,
      addClass,
      updateClass,
      deleteClass,
    } = require("./server/classes"));
    ({ getSetting, setSetting } = require("./server/settings"));
    ({
      getStaff,
      getStaffById,
      addStaff,
      updateStaff,
      searchStaff,
      deleteStaff,
    } = require("./server/staff"));
    ({
      getTransport,
      addTransport,
      updateTransport,
      deleteTransport,
    } = require("./server/transport"));
    ({
      getFees,
      addFees,
      updateFees,
      deleteFees,
      getStudentsForFees,
      getFeesReceipt,
      getNextReceiptNumber,
      getStudentTermSummary,
      getStudentMonthsStatus,
    } = require("./server/fees"));
    // Class shifts module not needed - removing reference
    ({ listClassesByBranch } = require("./server/classes"));
    ({
      listAcademicYears,
      addAcademicYear,
      updateAcademicYear,
      deleteAcademicYear,
      setActiveAcademicYear,
      getActiveAcademicYear,
    } = require("./server/academic_years"));
  } catch (e) {
    console.error("[main.js] Failed to initialize backend modules:", e);
  }

  // IPC handler for getting student's month-wise payment status
  ipcMain.handle("get-student-months-status", async (event, studentId) => {
    console.log(
      "[main.js] Handler called for get-student-months-status with studentId:",
      studentId
    );
    return new Promise((resolve) => {
      try {
        if (typeof getStudentMonthsStatus !== "function") {
          console.error(
            "[main.js] getStudentMonthsStatus is not a function:",
            typeof getStudentMonthsStatus
          );
          resolve({ success: false, error: "Backend function not available" });
          return;
        }

        getStudentMonthsStatus(studentId, (err, result) => {
          if (err) {
            console.error(
              "[main.js] Error in 'get-student-months-status' handler:",
              err
            );
            resolve({ success: false, error: err.message });
          } else {
            console.log("[main.js] Successfully got months status:", result);
            resolve({ success: true, ...result });
          }
        });
      } catch (error) {
        console.error(
          "[main.js] Exception in 'get-student-months-status' handler:",
          error
        );
        resolve({ success: false, error: error.message });
      }
    });
  });

  createWindow();
});

// Utility: Save HTML content via a Save dialog
ipcMain.handle("save-student-report", async (event, payload) => {
  try {
    const { html, defaultPath } = payload || {};
    if (!html || typeof html !== "string") {
      throw new Error("No HTML content provided");
    }
    const win = BrowserWindow.getFocusedWindow();
    const { canceled, filePath } = await dialog.showSaveDialog(win || null, {
      title: "Save Student Report",
      defaultPath: defaultPath || "student-report.html",
      filters: [
        { name: "HTML Files", extensions: ["html", "htm"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }
    await fs.promises.writeFile(filePath, html, "utf-8");
    return { success: true, path: filePath };
  } catch (error) {
    console.error("[main.js] Error in 'save-student-report':", error);
    return { success: false, error: error.message };
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
    return []; // Return empty array
  }
});

ipcMain.handle("add-branch", async (_event, payload) => {
  try {
    const branch = await addBranch(payload || {});
    return { success: true, branch };
  } catch (error) {
    console.error("[main.js] Error in 'add-branch' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("update-branch", async (_event, payload) => {
  try {
    const branch = await updateBranch(payload || {});
    return { success: true, branch };
  } catch (error) {
    console.error("[main.js] Error in 'update-branch' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("delete-branch", async (_event, id) => {
  try {
    await deleteBranch(id);
    return { success: true };
  } catch (error) {
    console.error("[main.js] Error in 'delete-branch' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle(
  "get-students",
  async (event, branch_id, academicYearId = null) => {
    console.log(
      "[main.js] 'get-students' handler called with branch_id:",
      branch_id,
      "academicYearId:",
      academicYearId
    );
    try {
      const students = await getStudents(branch_id, academicYearId);
      return students;
    } catch (error) {
      console.error("[main.js] Error in 'get-students' handler:", error);
      throw error;
    }
  }
);

ipcMain.handle(
  "get-students-by-teacher",
  async (event, branch_id, academicYearId = null, teacherId = null, classId = null, shiftName = null, division = null) => {
    console.log(
      "[main.js] 'get-students-by-teacher' handler called with:",
      { branch_id, academicYearId, teacherId, classId, shiftName, division }
    );
    try {
      const students = await getStudentsByTeacher(branch_id, academicYearId, teacherId, classId, shiftName, division);
      return students;
    } catch (error) {
      console.error("[main.js] Error in 'get-students-by-teacher' handler:", error);
      throw error;
    }
  }
);

ipcMain.handle(
  "search-students",
  async (event, branch_id, query, academicYearId = null) => {
    console.log(
      "[main.js] IPC handler 'search-students' invoked.",
      branch_id,
      query,
      academicYearId
    );
    try {
      const students = await searchStudents(branch_id, query, academicYearId);
      return students;
    } catch (error) {
      console.error("[main.js] Error in 'search-students' handler:", error);
      return [];
    }
  }
);

ipcMain.handle(
  "get-next-roll-number",
  async (event, classId, shiftId, division) => {
    console.log("[main.js] IPC handler 'get-next-roll-number' invoked.", {
      classId,
      shiftId,
      division,
    });
    try {
      const next = await getNextRollNumber(classId, shiftId, division);
      return { success: true, next };
    } catch (error) {
      console.error(
        "[main.js] Error in 'get-next-roll-number' handler:",
        error
      );
      return { success: false, error: error.message };
    }
  }
);

ipcMain.handle(
  "get-next-roll-number-by-entry",
  async (event, classEntryId, division) => {
    console.log(
      "[main.js] IPC handler 'get-next-roll-number-by-entry' invoked.",
      { classEntryId, division }
    );
    try {
      const next = await getNextRollNumberByEntry(classEntryId, division);
      return { success: true, next };
    } catch (error) {
      console.error(
        "[main.js] Error in 'get-next-roll-number-by-entry' handler:",
        error
      );
      return { success: false, error: error.message };
    }
  }
);

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
  console.log(
    "🔵 [BACKEND] main.js: IPC handler 'delete-student' invoked with ID:",
    id
  );
  console.log("🔵 [BACKEND] main.js: ID type:", typeof id);
  console.log("🔵 [BACKEND] main.js: ID value:", JSON.stringify(id));

  try {
    console.log("🔵 [BACKEND] main.js: Calling deleteStudent function...");
    const result = await deleteStudent(id);
    console.log("🔵 [BACKEND] main.js: deleteStudent result:", result);
    console.log("🔵 [BACKEND] main.js: Returning success response");
    return { success: true, id: result.id };
  } catch (error) {
    console.error(
      "🔵 [BACKEND] main.js: Error in 'delete-student' handler:",
      error
    );
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

// Staff API handlers
ipcMain.handle("get-staff", async () => {
  try {
    return await getStaff();
  } catch (error) {
    console.error("[main.js] Error in 'get-staff' handler:", error);
    return [];
  }
});

ipcMain.handle("get-staff-by-id", async (event, id) => {
  try {
    return await getStaffById(id);
  } catch (error) {
    console.error("[main.js] Error in 'get-staff-by-id' handler:", error);
    return null;
  }
});

ipcMain.handle("add-staff", async (event, staffData) => {
  try {
    const result = await addStaff(staffData);
    return { success: true, staff: result };
  } catch (error) {
    console.error("[main.js] Error in 'add-staff' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("update-staff", async (event, staffData) => {
  try {
    const result = await updateStaff(staffData);
    return { success: true, staff: result };
  } catch (error) {
    console.error("[main.js] Error in 'update-staff' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("search-staff", async (event, query) => {
  try {
    const results = await searchStaff(query);
    return results;
  } catch (error) {
    console.error("[main.js] Error in 'search-staff' handler:", error);
    throw error;
  }
});

ipcMain.handle("delete-staff", async (event, id) => {
  try {
    const result = await deleteStaff(id);
    return result;
  } catch (error) {
    console.error("[main.js] Error in 'delete-staff' handler:", error);
    throw error;
  }
});

// Class shifts handlers removed - not needed

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
      const type = paymentType === "cash" ? "cash" : "bank";
      getNextReceiptNumber(type, (err, next) => {
        if (err) {
          console.error("[main.js] Error in 'get-next-receipt-number':", err);
          resolve({
            success: false,
            error: err.message || "Failed to get next receipt number",
          });
        } else {
          resolve({ success: true, next });
        }
      });
    } catch (error) {
      console.error("[main.js] Exception in 'get-next-receipt-number':", error);
      resolve({
        success: false,
        error: error.message || "Failed to get next receipt number",
      });
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
        resolve({
          success: true,
          id: result.id,
          receipt_number: result.receipt_number,
        });
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

ipcMain.handle(
  "get-students-for-fees",
  async (event, branchId, academicYearId = null) => {
    return new Promise((resolve) => {
      getStudentsForFees(branchId, academicYearId, (err, students) => {
        if (err) {
          console.error(
            "[main.js] Error in 'get-students-for-fees' handler:",
            err
          );
          resolve({ success: false, error: err.message });
        } else {
          resolve({ success: true, students });
        }
      });
    });
  }
);

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
