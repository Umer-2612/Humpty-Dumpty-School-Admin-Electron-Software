import { StatusCodes } from "http-status-codes";
import { Classroom, Student } from "@/models";

function toResponse(entry) {
  if (!entry) return null;
  const totalFees =
    (Number(entry.term1Fee) || 0) +
    (Number(entry.term2Fee) || 0) +
    (Number(entry.booksCharge) || 0);
  return {
    id: entry._id?.toString() ?? entry.id,
    branch_id: entry.branch?.toString?.() ?? entry.branch,
    class_id: entry._id?.toString() ?? entry.id,
    class_name: entry.name,
    shift_name: entry.shiftName || "",
    start_time: entry.startTime || "",
    end_time: entry.endTime || "",
    division_count: entry.divisionCount ?? 0,
    term1_fee: entry.term1Fee ?? 0,
    term2_fee: entry.term2Fee ?? 0,
    books_charge: entry.booksCharge ?? 0,
    total_fees: totalFees,
    fees: entry.fees || {
      term1: entry.term1Fee ?? 0,
      term2: entry.term2Fee ?? 0,
      books: entry.booksCharge ?? 0,
    },
  };
}

export async function listClassesByBranch(req, res) {
  const { branchId } = req.params;
  if (!branchId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "branchId is required" });
  }
  const classes = await Classroom.find({ branch: branchId })
    .sort({ name: 1 })
    .lean();
  res.json(classes.map(toResponse));
}

export async function listAllClasses(req, res) {
  const classes = await Classroom.find()
    .populate("branch", "name")
    .sort({ "branch.name": 1, name: 1 })
    .lean();
  const mapped = classes.map((entry) => ({
    id: entry._id.toString(),
    class_name: entry.name,
    branch_name: entry.branch?.name || "",
    branch_id: entry.branch?._id?.toString(),
    num_divisions: entry.divisionCount || 0,
    shift_name: entry.shiftName || "",
  }));
  res.json(mapped);
}

export async function createClass(req, res) {
  const { branchId } = req.params;
  const payload = req.body || {};

  if (!branchId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "branchId is required" });
  }

  const classDoc = await Classroom.create({
    branch: branchId,
    name: payload.class_name || payload.name,
    shiftName: payload.shift_name || "",
    startTime: payload.start_time || payload.startTime || "",
    endTime: payload.end_time || payload.endTime || "",
    term1Fee: Number(payload.term1_fee ?? payload.term1Fee ?? 0),
    term2Fee: Number(payload.term2_fee ?? payload.term2Fee ?? 0),
    booksCharge: Number(payload.books_charge ?? payload.booksCharge ?? 0),
    divisionCount: Number(payload.division_count ?? payload.divisionCount ?? 0),
    fees: payload.fees || {
      term1: Number(payload.term1_fee ?? payload.term1Fee ?? 0),
      term2: Number(payload.term2_fee ?? payload.term2Fee ?? 0),
      books: Number(payload.books_charge ?? payload.booksCharge ?? 0),
    },
  });

  res
    .status(StatusCodes.CREATED)
    .json({ success: true, entry: toResponse(classDoc) });
}

export async function updateClass(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const payload = req.body || {};
  const updates = {};

  if (payload.branch_id !== undefined) updates.branch = payload.branch_id;
  if (payload.class_name !== undefined) updates.name = payload.class_name;
  if (payload.shift_name !== undefined) updates.shiftName = payload.shift_name;
  if (payload.start_time !== undefined) updates.startTime = payload.start_time;
  if (payload.end_time !== undefined) updates.endTime = payload.end_time;
  if (payload.division_count !== undefined)
    updates.divisionCount = Number(payload.division_count);
  if (payload.term1_fee !== undefined)
    updates.term1Fee = Number(payload.term1_fee);
  if (payload.term2_fee !== undefined)
    updates.term2Fee = Number(payload.term2_fee);
  if (payload.books_charge !== undefined)
    updates.booksCharge = Number(payload.books_charge);
  if (payload.fees !== undefined) updates.fees = payload.fees;

  const classDoc = await Classroom.findByIdAndUpdate(id, updates, { new: true });

  if (!classDoc) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Class not found" });
  }

  res.json({ success: true, entry: toResponse(classDoc) });
}

export async function deleteClass(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const studentCount = await Student.countDocuments({ class: id });
  if (studentCount > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Cannot delete class while students are assigned to it",
    });
  }

  const result = await Classroom.findByIdAndDelete(id);
  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Class not found" });
  }

  res.json({ success: true, id });
}
