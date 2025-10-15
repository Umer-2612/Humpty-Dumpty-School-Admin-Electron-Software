import { httpClient } from "./httpClient";

const api = {
  // Branches
  getBranches: () => httpClient.get("/branches"),
  addBranch: (payload) => httpClient.post("/branches", payload),
  updateBranch: ({ id, ...payload }) =>
    httpClient.put(`/branches/${id}`, payload),
  deleteBranch: (id) => httpClient.del(`/branches/${id}`),

  // Classes
  listClassesByBranch: (branchId) =>
    httpClient.get(`/classes/branch/${branchId}`),
  addClassEntry: ({ branch_id, ...payload }) =>
    httpClient.post(`/classes/branch/${branch_id}`, payload),
  updateClassEntry: ({ id, ...payload }) =>
    httpClient.put(`/classes/${id}`, payload),
  deleteClassEntry: (id) => httpClient.del(`/classes/${id}`),
  getClasses: () => httpClient.get("/classes"),
  getClassShifts: () => Promise.resolve([]),

  // Academic years
  listAcademicYears: () => httpClient.get("/academic-years"),
  addAcademicYear: (payload) => httpClient.post("/academic-years", payload),
  updateAcademicYear: ({ id, ...payload }) =>
    httpClient.put(`/academic-years/${id}`, payload),
  deleteAcademicYear: (id) => httpClient.del(`/academic-years/${id}`),
  setActiveAcademicYear: (id) =>
    httpClient.post(`/academic-years/${id}/activate`),
  getActiveAcademicYear: () => httpClient.get("/academic-years/active"),

  // Students
  getStudents: (branchId, academicYearId = null) =>
    httpClient.get("/students", {
      query: { branchId, academicYearId },
    }),
  getStudentsByTeacher: (
    branchId,
    academicYearId = null,
    teacherId = null,
    classId = null,
    shiftName = null,
    division = null
  ) =>
    httpClient.get("/students/by-teacher", {
      query: { branchId, academicYearId, teacherId, classId, shiftName, division },
    }),
  getStudentById: (id) => httpClient.get(`/students/${id}`),
  searchStudents: (branchId, query, academicYearId = null) =>
    httpClient.get("/students/search", {
      query: { branchId, query, academicYearId },
    }),
  searchStudentsByYear: (branchId, query, academicYearId = null) =>
    httpClient.get("/students/search", {
      query: { branchId, query, academicYearId },
    }),
  addStudent: (payload) => httpClient.post("/students", payload),
  updateStudent: ({ id, ...payload }) =>
    httpClient.put(`/students/${id}`, payload),
  deleteStudent: (id) => httpClient.del(`/students/${id}`),
  getNextRollNumber: (classId, division, academicYearId = null) =>
    httpClient.get(`/students/classes/${classId}/next-roll-number`, {
      query: { division, academicYearId },
    }),
  getNextRollNumberByEntry: (classEntryId, division, academicYearId = null) =>
    httpClient.get(`/students/class-entries/${classEntryId}/next-roll-number`, {
      query: { division, academicYearId },
    }),

  // Settings
  getSetting: (key) => httpClient.get(`/settings/${key}`),
  setSetting: (key, value) => httpClient.put(`/settings/${key}`, value),

  // Staff
  getStaff: () => httpClient.get("/staff"),
  getTeachers: () => httpClient.get("/staff/teachers"),
  getStaffById: (id) => httpClient.get(`/staff/${id}`),
  addStaff: (payload) => httpClient.post("/staff", payload),
  updateStaff: ({ id, ...payload }) => httpClient.put(`/staff/${id}`, payload),
  deleteStaff: (id) => httpClient.del(`/staff/${id}`),
  searchStaff: (query) => httpClient.get("/staff/search", { query: { query } }),

  // Transport
  getTransport: () => httpClient.get("/transport"),
  addTransport: (payload) => httpClient.post("/transport", payload),
  updateTransport: ({ id, ...payload }) =>
    httpClient.put(`/transport/${id}`, payload),
  deleteTransport: (id) => httpClient.del(`/transport/${id}`),

  // Fees
  getFees: (branchId, academicYearId = null) =>
    httpClient.get("/fees", {
      query: { branchId, academicYearId },
    }),
  addFees: (payload) => httpClient.post("/fees", payload),
  updateFees: ({ id, ...payload }) => httpClient.put(`/fees/${id}`, payload),
  deleteFees: (id) => httpClient.del(`/fees/${id}`),
  getStudentsForFees: async (branchId, academicYearId = null) => {
    const students = await httpClient.get("/fees/students", {
      query: { branchId, academicYearId },
    });
    return { success: true, students };
  },
  getFeesReceipt: (receiptNumber) =>
    httpClient.get(`/fees/receipt/${encodeURIComponent(receiptNumber)}`),
  getNextReceiptNumber: (paymentType) =>
    httpClient.get("/fees/next-receipt-number", {
      query: { type: paymentType },
    }),
  getStudentTermSummary: (studentId, academicYearId = null) =>
    httpClient.get(`/fees/students/${studentId}/term-summary`, {
      query: { academicYearId },
    }),
  getStudentMonthsStatus: (studentId) =>
    httpClient.get(`/fees/students/${studentId}/months-status`),

  // Reports (not supported in web version)
  saveStudentReport: () =>
    Promise.resolve({ success: false, error: "Report export is not supported in web mode." }),
  saveStudentReportPdf: () =>
    Promise.resolve({ success: false, error: "PDF export is not supported in web mode." }),
};

export function installWebAPI(target) {
  const resolvedTarget =
    target || (typeof window !== "undefined" ? window : null);
  if (resolvedTarget) {
    resolvedTarget.electronAPI = api;
  }
  return api;
}

export default api;
