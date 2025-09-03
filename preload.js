const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBranches: () => ipcRenderer.invoke("get-branches"),
  getStudents: (branch_id, academicYearId = null) =>
    ipcRenderer.invoke("get-students", branch_id, academicYearId),
  getStudentsByTeacher: (branch_id, academicYearId = null, teacherId = null, classId = null, shiftName = null, division = null) =>
    ipcRenderer.invoke("get-students-by-teacher", branch_id, academicYearId, teacherId, classId, shiftName, division),
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
  // Staff API methods
  getStaff: () => ipcRenderer.invoke("get-staff"),
  getStaffById: (id) => ipcRenderer.invoke("get-staff-by-id", id),
  addStaff: (staffData) => ipcRenderer.invoke("add-staff", staffData),
  updateStaff: (staffData) => ipcRenderer.invoke("update-staff", staffData),
  searchStaff: (query) => ipcRenderer.invoke("search-staff", query),
  deleteStaff: (id) => ipcRenderer.invoke("delete-staff", id),
  // Legacy teacher methods for backward compatibility
  getTeachers: () => ipcRenderer.invoke("get-teachers"),
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
  getStudentMonthsStatus: (studentId) =>
    ipcRenderer.invoke("get-student-months-status", studentId),

  // Classes APIs
  listClassesByBranch: (branch_id) =>
    ipcRenderer.invoke("list-classes-by-branch", branch_id),
  addClassEntry: (payload) => ipcRenderer.invoke("add-class", payload),
  updateClassEntry: (payload) => ipcRenderer.invoke("update-class", payload),
  deleteClassEntry: (id) => ipcRenderer.invoke("delete-class", id),

  // Reports
  saveStudentReport: (html, defaultPath) =>
    ipcRenderer.invoke("save-student-report", { html, defaultPath }),
  saveStudentReportPdf: (html, defaultPath) =>
    ipcRenderer.invoke("save-student-report-pdf", { html, defaultPath }),

  // Academic Year API methods
  listAcademicYears: () => ipcRenderer.invoke("list-academic-years"),
  addAcademicYear: (payload) =>
    ipcRenderer.invoke("add-academic-year", payload),
  updateAcademicYear: (payload) =>
    ipcRenderer.invoke("update-academic-year", payload),
  deleteAcademicYear: (id) =>
    ipcRenderer.invoke("delete-academic-year", id),
  setActiveAcademicYear: (id) =>
    ipcRenderer.invoke("set-active-academic-year", id),
  getActiveAcademicYear: () => ipcRenderer.invoke("get-active-academic-year"),
});
