import mongoose from "mongoose";
import { Fee, Student } from "@/models";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getMonthIndex(monthYear) {
  if (!monthYear) return -1;
  const normalized = monthYear.split(" ")[0];
  return MONTHS.findIndex(
    (month) => month.toLowerCase() === normalized.toLowerCase()
  );
}

export function getMonthName(index) {
  if (index < 0 || index >= MONTHS.length) return null;
  return MONTHS[index];
}

export async function updateStudentMonthsPaid(studentId, monthYear, amount) {
  if (!studentId || !monthYear) return;
  const student = await Student.findById(studentId);
  if (!student) return;

  const monthsPaid = student.monthsPaid
    ? Object.fromEntries(student.monthsPaid)
    : {};

  const targetIndex = getMonthIndex(monthYear);
  const today = new Date().toISOString().split("T")[0];

  if (targetIndex === -1) {
    const current = monthsPaid[monthYear] || { amount: 0 };
    monthsPaid[monthYear] = {
      amount: Number(current.amount || 0) + Number(amount || 0),
      paid_date: today,
      status: "paid",
    };
  } else {
    for (let i = 0; i <= targetIndex; i += 1) {
      const name = getMonthName(i);
      const current = monthsPaid[name] || {};
      if (!monthsPaid[name]) {
        monthsPaid[name] = {
          amount: i === targetIndex ? Number(amount || 0) : 0,
          paid_date: today,
          status: "paid",
        };
      } else if (i === targetIndex) {
        monthsPaid[name] = {
          amount: Number(current.amount || 0) + Number(amount || 0),
          paid_date: today,
          status: "paid",
        };
      } else {
        monthsPaid[name] = {
          amount: current.amount || 0,
          paid_date: current.paid_date || today,
          status: "paid",
        };
      }
    }
  }

  student.monthsPaid = monthsPaid;
  await student.save();
}

export async function removeStudentMonthsPaid(studentId, monthYear, amount) {
  if (!studentId || !monthYear) return;
  const student = await Student.findById(studentId);
  if (!student) return;

  const monthsPaid = student.monthsPaid
    ? Object.fromEntries(student.monthsPaid)
    : {};

  if (!monthsPaid[monthYear]) return;

  const currentAmount = Number(monthsPaid[monthYear].amount || 0);
  const newAmount = Math.max(0, currentAmount - Number(amount || 0));
  if (newAmount <= 0) {
    delete monthsPaid[monthYear];
  } else {
    monthsPaid[monthYear].amount = newAmount;
  }

  student.monthsPaid = monthsPaid;
  await student.save();
}

export async function recomputeStudentFeeBreakdown(
  studentId,
  academicYearId = null
) {
  if (!studentId) return;
  const student = await Student.findById(studentId).populate("class");
  if (!student) return;

  const effectiveYearId =
    academicYearId || student.academicYear?.toString?.() || null;

  let classFees = {};
  if (student.class?.fees) {
    classFees = student.class.fees;
  } else if (student.class) {
    classFees = {
      term1: Number(student.class.term1Fee || 0),
      term2: Number(student.class.term2Fee || 0),
      books: Number(student.class.booksCharge || 0),
    };
  }

  const match = { student: student._id };
  if (effectiveYearId) {
    match.academicYear = mongoose.Types.ObjectId.isValid(effectiveYearId)
      ? new mongoose.Types.ObjectId(effectiveYearId)
      : student.academicYear;
  }

  const fees = await Fee.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: "$feeTerm",
        paid: { $sum: "$amount" },
      },
    },
  ]);

  const paidByTerm = {};
  fees.forEach((entry) => {
    const term = (entry._id || "").toString();
    paidByTerm[term] = Number(entry.paid || 0);
  });

  const breakdown = {};
  Object.entries(classFees).forEach(([term, totalValue]) => {
    const total = Number(totalValue || 0);
    const paid = Number(paidByTerm[term] || 0);
    breakdown[term] = {
      total,
      paid,
      pending: Math.max(0, total - paid),
    };
  });

  const totalFees = Object.values(classFees).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const paidTotal = Object.values(paidByTerm).reduce(
    (sum, value) => sum + Number(value || 0),
    0
  );
  const pendingTotal = Math.max(0, totalFees - paidTotal);

  student.totalFees = totalFees;
  student.pendingFees = pendingTotal;
  student.feeBreakdown = breakdown;
  await student.save();
}

export async function adjustStudentPendingFees(studentId, delta) {
  if (!studentId || !delta) return;
  const student = await Student.findById(studentId);
  if (!student) return;
  const initial =
    typeof student.pendingFees === "number"
      ? student.pendingFees
      : student.totalFees || 0;
  const updated = Math.max(0, Number(initial) + Number(delta));
  student.pendingFees = updated;
  await student.save();
}

export async function inferFeeContext(
  studentId,
  providedYearId,
  providedTerm
) {
  if (!studentId) {
    return {
      academicYearId: providedYearId || null,
      feeTerm: providedTerm || null,
    };
  }

  const student = await Student.findById(studentId).populate("class");
  if (!student) {
    return {
      academicYearId: providedYearId || null,
      feeTerm: providedTerm || null,
    };
  }

  const academicYearId =
    providedYearId || student.academicYear?.toString?.() || null;

  if (providedTerm) {
    return { academicYearId, feeTerm: providedTerm };
  }

  const classFees = student.class?.fees || {};
  const match = { student: student._id };
  if (academicYearId) {
    match.academicYear = mongoose.Types.ObjectId.isValid(academicYearId)
      ? new mongoose.Types.ObjectId(academicYearId)
      : student.academicYear;
  }

  const fees = await Fee.aggregate([
    {
      $match: match,
    },
    {
      $group: {
        _id: "$feeTerm",
        paid: { $sum: "$amount" },
      },
    },
  ]);

  const paidByTerm = {};
  for (const row of fees) {
    const term = (row._id || "").toString();
    paidByTerm[term] = Number(row.paid || 0);
  }

  const priority = ["term1", "term2", "books"];
  const keys = Object.keys(classFees);
  const ordered = [...new Set([...priority, ...keys])].filter((key) =>
    keys.includes(key)
  );

  let chosen = null;
  for (const term of ordered.length ? ordered : keys) {
    const total = Number(classFees[term]) || 0;
    const paid = Number(paidByTerm[term] || 0);
    const pending = Math.max(0, total - paid);
    if (pending > 0) {
      chosen = term;
      break;
    }
  }

  if (!chosen) {
    chosen = ordered[0] || keys[0] || null;
  }

  return { academicYearId, feeTerm: chosen };
}

export function mapFeeToResponse(feeDocument, populatedStudent) {
  const fee =
    typeof feeDocument.toObject === "function"
      ? feeDocument.toObject({ virtuals: true })
      : { ...feeDocument };

  const student = populatedStudent || fee.student;
  const classDoc = student?.class;
  const branchDoc = fee.branch || student?.branch || classDoc?.branch;

  return {
    id: fee._id?.toString?.() || fee.id,
    student_id:
      student?._id?.toString?.() || fee.student?.toString?.() || null,
    branch_id:
      branchDoc?._id?.toString?.() || fee.branch?.toString?.() || null,
    academic_year_id:
      fee.academicYear?._id?.toString?.() ||
      fee.academicYear?.toString?.() ||
      null,
    amount: fee.amount,
    payment_type: fee.paymentType,
    cheque_number: fee.chequeNumber,
    cheque_date: fee.chequeDate
      ? new Date(fee.chequeDate).toISOString().slice(0, 10)
      : null,
    bank_name: fee.bankName,
    payee_name: fee.payeeName,
    upi_id: fee.upiId,
    receipt_number: fee.receiptNumber,
    payment_date: fee.paymentDate
      ? new Date(fee.paymentDate).toISOString().slice(0, 10)
      : null,
    academic_year: fee.academicYearLabel,
    month_year: fee.monthYear,
    notes: fee.notes,
    fee_term: fee.feeTerm,
    fee_charge: fee.feeCharge,
    created_at: fee.createdAt?.toISOString?.() || fee.created_at,
    student_name: student?.name,
    roll_number: student?.rollNumber,
    division: student?.division,
    class_name: classDoc?.name,
    branch_name: branchDoc?.name,
  };
}
