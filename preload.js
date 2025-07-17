const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBranches: () => ipcRenderer.invoke("get-branches"),
  getStudents: () => ipcRenderer.invoke("get-students"),
  addStudent: (studentData) => ipcRenderer.invoke("add-student", studentData),
  getClassesByBranch: (branch_id) =>
    ipcRenderer.invoke("get-classes-by-branch", branch_id),
  addClass: (classData) => ipcRenderer.invoke("add-class", classData),
  updateClass: (classData) => ipcRenderer.invoke("update-class", classData),
  deleteClass: (id) => ipcRenderer.invoke("delete-class", id),
});
