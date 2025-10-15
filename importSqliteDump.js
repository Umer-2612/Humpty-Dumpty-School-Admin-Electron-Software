/* eslint-disable no-console */
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const {
  Branch,
  AcademicYear,
  Classroom,
  Student,
  Staff,
  Transport,
  Fee,
  Setting,
} = require("../src/models");
const { connectDatabase } = require("../src/config/database");

const SOURCE_PATH = path.resolve(__dirname, "../../data.json");

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const normalized = value.includes(" ")
    ? value.replace(" ", "T")
    : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseJsonField = (value) => {
  if (!value || value === "null") return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
};

const normalizeNumber = (input, fallback = 0) => {
  const num = Number(input);
  return Number.isFinite(num) ? num : fallback;
};

async function run() {
  if (!fs.existsSync(SOURCE_PATH)) {
    throw new Error(`Seed file not found at ${SOURCE_PATH}`);
  }

  const json = JSON.parse(fs.readFileSync(SOURCE_PATH, "utf-8"));

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not configured");
  }

  await connectDatabase(uri);
  console.log("✅ Connected to MongoDB");

  console.log("🧹 Clearing existing collections…");
  await Promise.all([
    Branch.deleteMany({}),
    AcademicYear.deleteMany({}),
    Classroom.deleteMany({}),
    Student.deleteMany({}),
    Staff.deleteMany({}),
    Transport.deleteMany({}),
    Fee.deleteMany({}),
    Setting.deleteMany({}),
  ]);

  const branchMap = new Map();
  const classMap = new Map();
  const yearMap = new Map();
  const staffMap = new Map();
  const studentMap = new Map();

  console.log("📦 Importing branches…");
  for (const branch of json.branches || []) {
    const doc = await Branch.create({
      name: (branch.name || "").trim(),
    });
    branchMap.set(branch.id, doc._id);
  }

  console.log("📦 Importing academic years…");
  for (const year of json.academic_years || []) {
    const doc = await AcademicYear.create({
      name: year.name,
      startDate: parseDate(year.start_date),
      endDate: parseDate(year.end_date),
      isActive: !!year.is_active,
    });
    yearMap.set(year.id, doc._id);
  }

  console.log("📦 Importing classes…");
  for (const cls of json.classes || []) {
    const branchId = branchMap.get(cls.branch_id);
    if (!branchId) continue;

    const feesJson =
      parseJsonField(cls.fees) || {
        term1: normalizeNumber(cls.term1_fee),
        term2: normalizeNumber(cls.term2_fee),
        books: normalizeNumber(cls.books_charge),
      };

    const doc = await Classroom.create({
      branch: branchId,
      name: cls.name,
      shiftName: cls.shift_name || "",
      startTime: cls.start_time || "",
      endTime: cls.end_time || "",
      term1Fee: normalizeNumber(cls.term1_fee),
      term2Fee: normalizeNumber(cls.term2_fee),
      booksCharge: normalizeNumber(cls.books_charge),
      divisionCount: normalizeNumber(cls.num_divisions),
      fees: feesJson,
    });
    classMap.set(cls.id, { id: doc._id, branch: doc.branch });
  }

  console.log("📦 Importing staff…");
  for (const member of json.staff || []) {
    const doc = await Staff.create({
      name: member.name || "",
      contact: member.contact || "",
      staffType: member.staff_type === "teacher" ? "teacher" : "office",
      role: member.role || "",
      assignments: [],
    });
    staffMap.set(member.id, doc._id);
  }

  console.log("📦 Assigning teacher classes…");
  const assignmentsByStaff = new Map();
  for (const assignment of json.teacher_assignments || []) {
    const staffId = staffMap.get(assignment.staff_id);
    const classEntry = classMap.get(assignment.class_id);
    if (!staffId || !classEntry) continue;
    const entry = assignmentsByStaff.get(staffId) || [];
    entry.push({
      class: classEntry.id,
      division: assignment.division || "",
    });
    assignmentsByStaff.set(staffId, entry);
  }
  for (const [staffId, assignments] of assignmentsByStaff.entries()) {
    await Staff.findByIdAndUpdate(
      staffId,
      { assignments },
      { new: true }
    );
  }

  console.log("📦 Importing students…");
  for (const student of json.students || []) {
    const classEntry = classMap.get(student.class_id);
    if (!classEntry) continue;

    const doc = await Student.create({
      branch: classEntry.branch,
      class: classEntry.id,
      academicYear: yearMap.get(student.academic_year_id) || null,
      name: student.name || "",
      rollNumber: (student.roll_number || "").toString(),
      division: student.division || "",
      parentsContact1: student.parents_contact1 || "",
      parentsContact2: student.parents_contact2 || "",
      admissionDate: parseDate(student.admission_date),
      gender: student.gender || "",
      motherName: student.mother_name || "",
      fatherName: student.father_name || "",
      feeScholarship: normalizeNumber(student.fee_scholarship),
      birthPlace: student.birth_place || "",
      religion: student.religion || "",
      address: student.address || "",
      totalFees: normalizeNumber(student.total_fees),
      pendingFees: normalizeNumber(student.pending_fees),
      feeBreakdown: parseJsonField(student.fee_breakdown),
      monthsPaid: parseJsonField(student.months_paid) || {},
    });
    studentMap.set(student.id, doc._id);
  }

  console.log("📦 Importing transports…");
  for (const item of json.transports || []) {
    await Transport.create({
      driverName: item.driver_name || "",
      driverRoute: item.driver_route || "",
      driverCar: item.driver_car || "",
      driverCarNumber: item.driver_car_number || "",
      driverContact: item.driver_contact || "",
    });
  }

  console.log("📦 Importing fees…");
  for (const fee of json.fees || []) {
    const studentId = studentMap.get(fee.student_id);
    const branchId = branchMap.get(fee.branch_id);
    if (!studentId || !branchId) continue;

    await Fee.create({
      student: studentId,
      branch: branchId,
      academicYear: yearMap.get(fee.academic_year_id) || null,
      amount: normalizeNumber(fee.amount),
      paymentType: fee.payment_type === "cash" ? "cash" : "bank",
      chequeNumber: fee.cheque_number || null,
      chequeDate: parseDate(fee.cheque_date),
      bankName: fee.bank_name || null,
      payeeName: fee.payee_name || null,
      upiId: fee.upi_id || null,
      receiptNumber: fee.receipt_number || "",
      paymentDate: parseDate(fee.payment_date) || new Date(),
      academicYearLabel: fee.academic_year || null,
      monthYear: fee.month_year || null,
      notes: fee.notes || null,
      feeTerm: fee.fee_term || null,
      feeCharge: fee.fee_charge ? normalizeNumber(fee.fee_charge) : undefined,
    });
  }

  console.log("📦 Importing settings…");
  for (const setting of json.settings || []) {
    await Setting.create({
      key: setting.key,
      value: parseJsonField(setting.value),
      category: setting.category || "general",
    });
  }

  console.log("✅ Import complete!");
}

run()
  .catch((err) => {
    console.error("❌ Import failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
    console.log("👋 Disconnected from MongoDB");
  });
