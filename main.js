const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const { getBranches } = require("./server/branches");
const { getStudents, addStudent, getClasses } = require("./server/students");
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
  getClassShifts,
  addClassShift,
  updateClassShift,
  deleteClassShift,
} = require("./server/class_shifts");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const startURL = app.isPackaged
    ? `file://${path.join(__dirname, "client/dist/index.html")}`
    : "http://localhost:5173";

  win.loadURL(startURL);
}

app.whenReady().then(() => {
  createWindow();
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

ipcMain.handle("get-students", async (event, branch_id) => {
  console.log("[main.js] IPC handler 'get-students' invoked.", branch_id);
  try {
    const students = await getStudents(branch_id);
    return students;
  } catch (error) {
    console.error("[main.js] Error in 'get-students' handler:", error);
    return [];
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
