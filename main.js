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

ipcMain.handle("get-students", async () => {
  console.log("[main.js] IPC handler 'get-students' invoked.");
  try {
    const students = await getStudents();
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
    return { success: false, error: error.message };
  }
});

ipcMain.handle("get-classes", async () => {
  console.log("[main.js] IPC handler 'get-classes' invoked.");
  try {
    const classes = await getClasses();
    return classes;
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
    return { success: true, class: result };
  } catch (error) {
    console.error("[main.js] Error in 'add-class' handler:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("update-class", async (event, classData) => {
  console.log("[main.js] IPC handler 'update-class' invoked.", classData);
  try {
    const result = await updateClass(classData);
    return { success: true, class: result };
  } catch (error) {
    console.error("[main.js] Error in 'update-class' handler:", error);
    return { success: false, error: error.message };
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
