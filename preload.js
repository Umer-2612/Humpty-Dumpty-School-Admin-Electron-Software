const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBranches: () => ipcRenderer.invoke("get-branches"),
  getStudents: (branch_id, academicYearId = null) =>
    ipcRenderer.invoke("get-students", branch_id, academicYearId),
  getStudentById: (id) => ipcRenderer.invoke("get-student-by-id", id),
  searchStudents: (branch_id, query) =>
    ipcRenderer.invoke("search-students", branch_id, query, null),
  searchStudentsByYear: (branch_id, query, academicYearId = null) =>
    ipcRenderer.invoke("search-students", branch_id, query, academicYearId),
  addStudent: (studentData) => ipcRenderer.invoke("add-student", studentData),
  updateStudent: (studentData) =>
    ipcRenderer.invoke("update-student", studentData),
  deleteStudent: (id) => ipcRenderer.invoke("delete-student", id),
  getNextRollNumber: (classId, division) =>
    ipcRenderer.invoke("get-next-roll-number", classId, division),
  getNextRollNumberByEntry: (classEntryId, division) =>
    ipcRenderer.invoke("get-next-roll-number-by-entry", classEntryId, division),
  getSetting: (key) => ipcRenderer.invoke("get-setting", key),
  setSetting: (key, value) => ipcRenderer.invoke("set-setting", key, value),
  getTeachers: () => ipcRenderer.invoke("get-teachers"),
  addTeacher: (teacherData) => ipcRenderer.invoke("add-teacher", teacherData),
  updateTeacher: (teacherData) =>
    ipcRenderer.invoke("update-teacher", teacherData),
  deleteTeacher: (id) => ipcRenderer.invoke("delete-teacher", id),
  getClasses: () => ipcRenderer.invoke("get-classes"),
  // Class shifts removed - return empty array for compatibility
  getClassShifts: () => Promise.resolve([]),
  getTransport: () => ipcRenderer.invoke("get-transport"),
  addTransport: (transportData) =>
    ipcRenderer.invoke("add-transport", transportData),
  updateTransport: (transportData) =>
    ipcRenderer.invoke("update-transport", transportData),
  deleteTransport: (id) => ipcRenderer.invoke("delete-transport", id),
  // Fees API methods
  getFees: (branchId, academicYearId = null) =>
    ipcRenderer.invoke("get-fees", branchId, academicYearId),
  addFees: (feesData) => ipcRenderer.invoke("add-fees", feesData),
  updateFees: (feesData) => ipcRenderer.invoke("update-fees", feesData),
  deleteFees: (id) => ipcRenderer.invoke("delete-fees", id),
  getStudentsForFees: (branchId, academicYearId = null) =>
    ipcRenderer.invoke("get-students-for-fees", branchId, academicYearId),
  getFeesReceipt: (receiptNumber) =>
    ipcRenderer.invoke("get-fees-receipt", receiptNumber),
  getNextReceiptNumber: (paymentType) =>
    ipcRenderer.invoke("get-next-receipt-number", paymentType),
  getStudentTermSummary: (studentId, academicYearId = null) =>
    ipcRenderer.invoke("get-student-term-summary", studentId, academicYearId),

  // Classes APIs
  listClassesByBranch: (branch_id) =>
    ipcRenderer.invoke("list-classes-by-branch", branch_id),
  addClassEntry: (payload) => ipcRenderer.invoke("add-class", payload),
  updateClassEntry: (payload) =>
    ipcRenderer.invoke("update-class", payload),
  deleteClassEntry: (id) => ipcRenderer.invoke("delete-class", id),

  // Reports
  saveStudentReport: (html, defaultPath) =>
    ipcRenderer.invoke("save-student-report", { html, defaultPath }),
  saveStudentReportPdf: (html, defaultPath) =>
    ipcRenderer.invoke("save-student-report-pdf", { html, defaultPath }),

  // Academic Year API methods
  listAcademicYears: () => ipcRenderer.invoke("list-academic-years"),
  addAcademicYear: (payload) => ipcRenderer.invoke("add-academic-year", payload),
  updateAcademicYear: (payload) => ipcRenderer.invoke("update-academic-year", payload),
  setActiveAcademicYear: (id) => ipcRenderer.invoke("set-active-academic-year", id),
  getActiveAcademicYear: () => ipcRenderer.invoke("get-active-academic-year"),
});
