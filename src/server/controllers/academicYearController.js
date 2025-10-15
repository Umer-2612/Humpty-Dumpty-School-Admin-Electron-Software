import { StatusCodes } from "http-status-codes";
import { AcademicYear, Student, Fee } from "@/models";
import { toClientDoc, toClientList } from "@/utils/formatter";

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listAcademicYears(req, res) {
  const years = await AcademicYear.find().sort({ startDate: -1 }).lean();
  res.json(toClientList(years));
}

export async function createAcademicYear(req, res) {
  const { name, startDate, endDate, isActive } = req.body || {};

  if (!name || !startDate || !endDate) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "name, startDate, endDate are required",
    });
  }

  const existing = await AcademicYear.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  }).lean();
  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Academic year already exists",
    });
  }

  const year = await AcademicYear.create({
    name,
    startDate: parseDate(startDate),
    endDate: parseDate(endDate),
    isActive: !!isActive,
  });

  if (isActive) {
    await AcademicYear.updateMany(
      { _id: { $ne: year._id } },
      { $set: { isActive: false } }
    );
  }

  res
    .status(StatusCodes.CREATED)
    .json({ success: true, academicYear: toClientDoc(year) });
}

export async function updateAcademicYear(req, res) {
  const { id } = req.params;
  const payload = req.body || {};

  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.startDate !== undefined)
    updates.startDate = parseDate(payload.startDate);
  if (payload.endDate !== undefined)
    updates.endDate = parseDate(payload.endDate);
  if (payload.isActive !== undefined)
    updates.isActive = !!payload.isActive;

  const year = await AcademicYear.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!year) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: "Academic year not found",
    });
  }

  if (updates.isActive) {
    await AcademicYear.updateMany(
      { _id: { $ne: year._id } },
      { $set: { isActive: false } }
    );
  }

  res.json({ success: true, academicYear: toClientDoc(year) });
}

export async function setActiveAcademicYear(req, res) {
  const { id } = req.params;

  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const year = await AcademicYear.findById(id);
  if (!year) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: "Academic year not found",
    });
  }

  await AcademicYear.updateMany({}, { $set: { isActive: false } });
  year.isActive = true;
  await year.save();

  res.json({ success: true, academicYear: toClientDoc(year) });
}

export async function getActiveAcademicYear(req, res) {
  const year = await AcademicYear.findOne({ isActive: true }).lean();
  res.json(year ? toClientDoc(year) : null);
}

export async function deleteAcademicYear(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const year = await AcademicYear.findById(id);
  if (!year) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: "Academic year not found",
    });
  }

  if (year.isActive) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Cannot delete the active academic year",
    });
  }

  const linkedStudent = await Student.exists({ academicYear: year._id });
  const linkedFees = await Fee.exists({ academicYear: year._id });

  if (linkedStudent || linkedFees) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Cannot delete academic year with linked data",
    });
  }

  await year.deleteOne();
  res.json({ success: true });
}
