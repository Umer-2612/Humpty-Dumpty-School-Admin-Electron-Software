const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBranches: () => ipcRenderer.invoke("get-branches"),
  getStudents: (branch_id) => ipcRenderer.invoke("get-students", branch_id),
  addStudent: (studentData) => ipcRenderer.invoke("add-student", studentData),
  getClassesByBranch: (branch_id) =>
    ipcRenderer.invoke("get-classes-by-branch", branch_id),
  addClass: (classData) => ipcRenderer.invoke("add-class", classData),
  updateClass: (classData) => ipcRenderer.invoke("update-class", classData),
  deleteClass: (id) => ipcRenderer.invoke("delete-class", id),
  getSetting: (key) => ipcRenderer.invoke("get-setting", key),
  setSetting: (key, value) => ipcRenderer.invoke("set-setting", key, value),
  getTeachers: () => ipcRenderer.invoke("get-teachers"),
  addTeacher: (teacherData) => ipcRenderer.invoke("add-teacher", teacherData),
  updateTeacher: (teacherData) =>
    ipcRenderer.invoke("update-teacher", teacherData),
  deleteTeacher: (id) => ipcRenderer.invoke("delete-teacher", id),
  getClasses: () => ipcRenderer.invoke("get-classes"),
  getClassShifts: () => ipcRenderer.invoke("get-class-shifts"),
  addClassShift: (shiftData) =>
    ipcRenderer.invoke("add-class-shift", shiftData),
  updateClassShift: (shiftData) =>
    ipcRenderer.invoke("update-class-shift", shiftData),
  deleteClassShift: (id) => ipcRenderer.invoke("delete-class-shift", id),
});
