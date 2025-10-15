import { StatusCodes } from "http-status-codes";
import { Staff } from "@/models";

function formatStaff(doc) {
  if (!doc) return null;
  const obj =
    typeof doc.toObject === "function"
      ? doc.toObject({ virtuals: true })
      : { ...doc };

  const assignments = Array.isArray(obj.assignments)
    ? obj.assignments.map((assignment) => {
        const classDoc = assignment.class || assignment.classroom;
        return {
          class_id:
            classDoc?._id?.toString?.() ||
            assignment.class?.toString?.() ||
            assignment.class,
          class_name: classDoc?.name || assignment.class_name || "",
          shift_name: classDoc?.shiftName || assignment.shift_name || "",
          division: assignment.division || "",
        };
      })
    : [];

  return {
    id: obj._id?.toString?.() || obj.id,
    name: obj.name,
    contact: obj.contact || "",
    staff_type: obj.staffType || obj.staff_type || "teacher",
    role: obj.role || "",
    assignments,
  };
}

function formatStaffList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(formatStaff);
}

export async function getStaff(req, res) {
  const staff = await Staff.find()
    .populate({ path: "assignments.class", select: "name shiftName" })
    .sort({ name: 1 });
  res.json(formatStaffList(staff));
}

export async function getTeachers(req, res) {
  const teachers = await Staff.find({ staffType: "teacher" })
    .populate({ path: "assignments.class", select: "name shiftName" })
    .sort({ name: 1 });
  res.json(formatStaffList(teachers));
}

export async function getStaffById(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const staff = await Staff.findById(id).populate({
    path: "assignments.class",
    select: "name shiftName",
  });

  if (!staff) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Staff not found" });
  }

  res.json({ success: true, staff: formatStaff(staff) });
}

export async function createStaff(req, res) {
  const payload = req.body || {};
  const normalizedType = payload.staff_type || "teacher";
  const assignmentsRaw = Array.isArray(payload.assignments)
    ? payload.assignments.map((assignment) => ({
        class: assignment.class_id,
        division: assignment.division || null,
      }))
    : [];
  const assignments = normalizedType === "teacher" ? assignmentsRaw : [];

  const staff = await Staff.create({
    name: payload.name,
    contact: payload.contact,
    staffType: normalizedType,
    role: payload.role,
    assignments,
  });

  const populated = await Staff.findById(staff._id).populate({
    path: "assignments.class",
    select: "name shiftName",
  });

  res
    .status(StatusCodes.CREATED)
    .json({ success: true, staff: formatStaff(populated) });
}

export async function updateStaff(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const payload = req.body || {};
  const normalizedType = payload.staff_type || "teacher";
  const assignmentsRaw = Array.isArray(payload.assignments)
    ? payload.assignments.map((assignment) => ({
        class: assignment.class_id,
        division: assignment.division || null,
      }))
    : [];
  const assignments = normalizedType === "teacher" ? assignmentsRaw : [];

  const updates = {
    name: payload.name,
    contact: payload.contact,
    staffType: normalizedType,
    role: payload.role,
    assignments,
  };

  const staff = await Staff.findByIdAndUpdate(id, updates, {
    new: true,
  }).populate({ path: "assignments.class", select: "name shiftName" });

  if (!staff) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Staff not found" });
  }

  res.json({ success: true, staff: formatStaff(staff) });
}

export async function deleteStaff(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const staff = await Staff.findByIdAndDelete(id);
  if (!staff) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Staff not found" });
  }

  res.json({ success: true, id });
}

export async function searchStaff(req, res) {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }

  const regex = new RegExp(query, "i");
  const staff = await Staff.find({
    $or: [{ name: regex }, { contact: regex }, { role: regex }],
  })
    .populate({ path: "assignments.class", select: "name shiftName" })
    .sort({ name: 1 });

  res.json(formatStaffList(staff));
}
