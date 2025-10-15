import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { Fee, Student, Branch, AcademicYear, Classroom } from "@/models";
import {
  adjustStudentPendingFees,
  updateStudentMonthsPaid,
  removeStudentMonthsPaid,
  inferFeeContext,
  recomputeStudentFeeBreakdown,
  mapFeeToResponse,
} from "@/server/services/feesService";
import { formatStudentList } from "@/utils/studentFormatter";

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function generateNextReceiptNumber(type) {
  const normalized = type === "cash" ? "cash" : "bank";
  const prefix = normalized === "cash" ? "C" : "B";

  const receipts = await Fee.find({
    receiptNumber: { $regex: `^${prefix}`, $options: "i" },
  })
    .select("receiptNumber")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  let max = 0;
  receipts.forEach((fee) => {
    const match = String(fee.receiptNumber || "").match(/(\d+)$/);
    if (match) {
      const value = parseInt(match[1], 10);
      if (!Number.isNaN(value) && value > max) {
        max = value;
      }
    }
  });

  return `${prefix}-${max + 1}`;
}

export async function getFees(req, res) {
  const { branchId, academicYearId } = req.query;
  if (!branchId) {
    return res.json({ fees: [], students: [], classes: [] });
  }

  const filter = { branch: branchId };
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }

  const feesPromise = Fee.find(filter)
    .populate({
      path: "student",
      populate: { path: "class", select: "name shiftName" },
    })
    .populate("branch")
    .sort({ createdAt: -1 });

  const studentFilter = { branch: branchId };
  if (academicYearId && academicYearId !== "all") {
    studentFilter.academicYear = academicYearId;
  }

  const studentsPromise = Student.find(studentFilter)
    .populate("class")
    .populate("branch")
    .lean();

  const classesPromise = Classroom.find({ branch: branchId }).lean();

  const [feesDocs, studentsDocs, classesDocs] = await Promise.all([
    feesPromise,
    studentsPromise,
    classesPromise,
  ]);

  const classes = (classesDocs || []).map((entry) => ({
    id: entry._id?.toString(),
    class_id: entry._id?.toString(),
    branch_id: entry.branch?.toString?.() || entry.branch,
    class_name: entry.name,
    shift_name: entry.shiftName || "",
    division_count: entry.divisionCount ?? entry.num_divisions ?? 0,
    fees:
      entry.fees || {
        term1: Number(entry.term1Fee) || 0,
        term2: Number(entry.term2Fee) || 0,
        books: Number(entry.booksCharge) || 0,
      },
  }));

  res.json({
    fees: feesDocs.map((fee) => mapFeeToResponse(fee)),
    students: formatStudentList(studentsDocs),
    classes,
  });
}

export async function createFee(req, res) {
  const payload = req.body || {};
  const studentId = payload.student_id;
  const branchId = payload.branch_id;
  const amount = Number(payload.amount || 0);
  if (!studentId || !branchId || !amount) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "student_id, branch_id, and amount are required",
    });
  }

  const student = await Student.findById(studentId).populate("class");
  if (!student) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Invalid student_id" });
  }

  const branch = await Branch.findById(branchId);
  if (!branch) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Invalid branch_id" });
  }

  const normalizedType = payload.payment_type === "cash" ? "cash" : "bank";
  const receiptNumber = await generateNextReceiptNumber(normalizedType);

  const { academicYearId, feeTerm } = await inferFeeContext(
    studentId,
    payload.academic_year_id,
    payload.fee_term
  );

  const academicYearDoc = academicYearId
    ? await AcademicYear.findById(academicYearId)
    : null;

  const feeDoc = await Fee.create({
    student: studentId,
    branch: branchId,
    academicYear: academicYearId || null,
    amount,
    paymentType: normalizedType,
    chequeNumber: payload.cheque_number || null,
    chequeDate: parseDate(payload.cheque_date),
    bankName: payload.bank_name || null,
    payeeName: payload.payee_name || null,
    upiId: payload.upi_id || null,
    receiptNumber,
    paymentDate: parseDate(payload.payment_date) || new Date(),
    academicYearLabel:
      payload.academic_year ||
      academicYearDoc?.name ||
      student.academicYear?.name ||
      null,
    monthYear: payload.month_year || null,
    notes: payload.notes || null,
    feeTerm: feeTerm || null,
    feeCharge: payload.fee_charge || null,
  });

  await adjustStudentPendingFees(studentId, -amount);
  if (payload.month_year) {
    await updateStudentMonthsPaid(studentId, payload.month_year, amount);
  }
  await recomputeStudentFeeBreakdown(studentId, academicYearId);

  const populatedFee = await Fee.findById(feeDoc._id)
    .populate({
      path: "student",
      populate: { path: "class", select: "name shiftName" },
    })
    .populate("branch");

  res.status(StatusCodes.CREATED).json({
    success: true,
    fee: mapFeeToResponse(populatedFee),
    receipt_number: receiptNumber,
  });
}

export async function updateFee(req, res) {
  const { id } = req.params;
  const payload = req.body || {};
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const existing = await Fee.findById(id);
  if (!existing) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Fee record not found" });
  }

  const newStudentId = payload.student_id || existing.student.toString();
  const newAmount = Number(payload.amount || existing.amount || 0);

  const { academicYearId, feeTerm } = await inferFeeContext(
    newStudentId,
    payload.academic_year_id,
    payload.fee_term || existing.feeTerm
  );

  const updates = {
    student: newStudentId,
    branch: payload.branch_id || existing.branch,
    academicYear: academicYearId || null,
    amount: newAmount,
    paymentType: payload.payment_type
      ? payload.payment_type === "cash"
        ? "cash"
        : "bank"
      : existing.paymentType,
    chequeNumber: payload.cheque_number ?? existing.chequeNumber ?? null,
    chequeDate:
      payload.cheque_date !== undefined
        ? parseDate(payload.cheque_date)
        : existing.chequeDate,
    bankName: payload.bank_name ?? existing.bankName ?? null,
    payeeName: payload.payee_name ?? existing.payeeName ?? null,
    upiId: payload.upi_id ?? existing.upiId ?? null,
    paymentDate:
      payload.payment_date !== undefined
        ? parseDate(payload.payment_date)
        : existing.paymentDate,
    academicYearLabel:
      payload.academic_year ?? existing.academicYearLabel ?? null,
    monthYear: payload.month_year ?? existing.monthYear ?? null,
    notes: payload.notes ?? existing.notes ?? null,
    feeTerm: feeTerm || null,
    feeCharge: payload.fee_charge ?? existing.feeCharge ?? null,
  };

  const prevStudentId = existing.student.toString();
  const prevAmount = Number(existing.amount || 0);
  const prevMonthYear = existing.monthYear;

  const sameStudent =
    prevStudentId === newStudentId.toString?.() || prevStudentId === newStudentId;

  if (sameStudent) {
    const delta = newAmount - prevAmount;
    if (delta !== 0) {
      await adjustStudentPendingFees(prevStudentId, -delta);
    }
    if (prevMonthYear) {
      await removeStudentMonthsPaid(prevStudentId, prevMonthYear, prevAmount);
    }
    if (updates.monthYear) {
      await updateStudentMonthsPaid(prevStudentId, updates.monthYear, newAmount);
    }
    await recomputeStudentFeeBreakdown(prevStudentId, academicYearId);
  } else {
    await adjustStudentPendingFees(prevStudentId, prevAmount);
    if (prevMonthYear) {
      await removeStudentMonthsPaid(prevStudentId, prevMonthYear, prevAmount);
    }
    await recomputeStudentFeeBreakdown(prevStudentId, existing.academicYear);

    await adjustStudentPendingFees(newStudentId, -newAmount);
    if (payload.month_year) {
      await updateStudentMonthsPaid(newStudentId, payload.month_year, newAmount);
    }
    await recomputeStudentFeeBreakdown(newStudentId, academicYearId);
  }

  const fee = await Fee.findByIdAndUpdate(id, updates, { new: true })
    .populate({
      path: "student",
      populate: { path: "class", select: "name shiftName" },
    })
    .populate("branch");

  res.json({ success: true, fee: mapFeeToResponse(fee) });
}

export async function deleteFee(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const fee = await Fee.findById(id);
  if (!fee) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Fee record not found" });
  }

  const amount = Number(fee.amount || 0);
  const studentId = fee.student.toString();
  const monthYear = fee.monthYear;

  await Fee.deleteOne({ _id: id });

  if (amount) {
    await adjustStudentPendingFees(studentId, amount);
  }
  if (monthYear) {
    await removeStudentMonthsPaid(studentId, monthYear, amount);
  }
  await recomputeStudentFeeBreakdown(
    studentId,
    fee.academicYear?.toString?.()
  );

  res.json({ success: true, id });
}

export async function getStudentsForFees(req, res) {
  const { branchId, academicYearId } = req.query;
  if (!branchId) {
    return res.json([]);
  }

  const filter = {
    branch: branchId,
  };
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }

  const students = await Student.find(filter)
    .populate("class")
    .sort({ "class.name": 1, rollNumber: 1 })
    .lean();

  const result = students.map((student) => ({
    id: student._id.toString(),
    name: student.name,
    roll_number: student.rollNumber,
    class_name: student.class?.name || "",
  }));

  res.json(result);
}

export async function getFeeReceipt(req, res) {
  const { receiptNumber } = req.params;
  if (!receiptNumber) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "receiptNumber is required" });
  }

  const fee = await Fee.findOne({ receiptNumber })
    .populate({
      path: "student",
      populate: { path: "class", select: "name shiftName" },
    })
    .populate("branch")
    .populate("academicYear");

  if (!fee) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Receipt not found" });
  }

  res.json({ success: true, receipt: mapFeeToResponse(fee) });
}

export async function getNextReceiptNumberHandler(req, res) {
  const type = req.query.type || "cash";
  const receipt = await generateNextReceiptNumber(
    type === "cash" ? "cash" : "bank"
  );
  res.json({ success: true, next: receipt });
}

export async function getStudentTermSummary(req, res) {
  const { studentId } = req.params;
  const { academicYearId } = req.query;
  if (!studentId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "studentId is required" });
  }

  const student = await Student.findById(studentId).populate("class");
  if (!student) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Student not found" });
  }

  const yearId =
    academicYearId || student.academicYear?.toString?.() || null;

  const classFees = student.class?.fees || {};

  const match = {
    student: student._id,
  };
  if (yearId) {
    match.academicYear = mongoose.Types.ObjectId.isValid(yearId)
      ? new mongoose.Types.ObjectId(yearId)
      : student.academicYear;
  }

  const rows = await Fee.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$feeTerm",
        paid: { $sum: "$amount" },
      },
    },
  ]);

  const terms = {};
  Object.entries(classFees).forEach(([term, totalValue]) => {
    const paidRow = rows.find((row) => (row._id || "").toString() === term);
    const paid = Number(paidRow?.paid || 0);
    const total = Number(totalValue || 0);
    terms[term] = {
      total,
      paid,
      pending: Math.max(0, total - paid),
    };
  });

  res.json({ success: true, summary: { terms } });
}

export async function getStudentMonthsStatus(req, res) {
  const { studentId } = req.params;
  if (!studentId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "studentId is required" });
  }

  const student = await Student.findById(studentId).lean();
  if (!student) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Student not found" });
  }

  const monthsPaid = student.monthsPaid
    ? Object.fromEntries(
        Object.entries(student.monthsPaid).map(([key, value]) => [key, value])
      )
    : {};

  const monthsStatus = {};
  const months = [
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
  months.forEach((month) => {
    monthsStatus[month] = {
      paid: !!monthsPaid[month],
      amount: monthsPaid[month]?.amount || 0,
      paid_date: monthsPaid[month]?.paid_date || null,
      status: monthsPaid[month]?.status || "pending",
    };
  });

  res.json({ success: true, monthsStatus, monthsPaid });
}
