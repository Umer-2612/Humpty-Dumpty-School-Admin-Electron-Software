import { StatusCodes } from "http-status-codes";
import { AcademicYear, Classroom, Staff, Student } from "@/models";
import {
  formatStudent,
  formatStudentList,
} from "@/utils/studentFormatter";

async function resolveAcademicYear(preferredId) {
  if (preferredId) {
    return preferredId;
  }

  const active = await AcademicYear.findOne({ isActive: true }).lean();
  return active ? active._id.toString() : null;
}

function normalizeDivision(division) {
  return division ? String(division).trim() : null;
}

async function getStudents(req, res) {
  const { branchId } = req.query;
  const academicYearId = req.query.academicYearId || req.query.yearId || null;

  const filter = {};
  if (branchId) filter.branch = branchId;
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }

  const students = await Student.find(filter)
    .populate("class")
    .populate("academicYear")
    .populate("branch")
    .sort({ createdAt: -1 })
    .lean();

  res.json(formatStudentList(students));
}

async function getStudentById(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "id is required" });
  }

  const student = await Student.findById(id)
    .populate("class")
    .populate("academicYear")
    .populate("branch")
    .lean();

  if (!student) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Student not found" });
  }

  res.json(formatStudent(student));
}

async function searchStudents(req, res) {
  const { branchId, query, academicYearId } = req.query;
  const trimmed = (query || "").trim();
  if (!trimmed) {
    return res.json([]);
  }

  const regex = new RegExp(trimmed, "i");
  const filter = {
    $or: [
      { name: regex },
      { rollNumber: regex },
    ],
  };

  if (branchId) filter.branch = branchId;
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }

  const students = await Student.find(filter)
    .populate("class")
    .populate("branch")
    .sort({ name: 1 })
    .limit(50)
    .lean();

  res.json(formatStudentList(students));
}

async function getStudentsByTeacher(req, res) {
  const {
    branchId,
    academicYearId,
    teacherId,
    classId,
    shiftName,
    division,
  } = req.query;

  const filter = {};
  if (branchId) filter.branch = branchId;
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }
  if (classId) filter.class = classId;
  if (division) filter.division = division;

  let students = await Student.find(filter)
    .populate("class")
    .populate("branch")
    .lean();

  if (teacherId) {
    const teacher = await Staff.findById(teacherId).lean();
    if (teacher && Array.isArray(teacher.assignments) && teacher.assignments.length) {
      const assignments = teacher.assignments.map((entry) => ({
        class: entry.class?.toString?.() || entry.class,
        division: normalizeDivision(entry.division),
      }));
      students = students.filter((student) => {
        const classIdStr = student.class?._id?.toString?.() || student.class?.toString?.() || student.class_id;
        const divisionStr = normalizeDivision(student.division);
        return assignments.some((assignment) => {
          if (assignment.class !== classIdStr) return false;
          if (!assignment.division) return true;
          return assignment.division === divisionStr;
        });
      });
    }
  }

  if (shiftName) {
    students = students.filter(
      (student) =>
        (student.class?.shiftName || "").toLowerCase() ===
        String(shiftName).toLowerCase()
    );
  }

  res.json(formatStudentList(students));
}

async function createStudent(req, res) {
  const payload = req.body || {};
  const {
    name,
    roll_number,
    class_id,
    division,
    academic_year_id,
  } = payload;

  if (!name || !roll_number || !class_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "name, roll_number, class_id are required",
    });
  }

  const divisionNormalized = normalizeDivision(division);

  const duplicate = await Student.findOne({
    class: class_id,
    division: divisionNormalized,
    rollNumber: roll_number,
  }).lean();

  if (duplicate) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Roll number already exists in this class and division.",
    });
  }

  const classroom = await Classroom.findById(class_id).lean();
  if (!classroom) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Invalid class_id" });
  }

  const academicYear = await resolveAcademicYear(academic_year_id);

  const student = await Student.create({
    name,
    rollNumber: roll_number,
    class: class_id,
    branch: classroom.branch,
    division: divisionNormalized,
    academicYear,
    parentsContact1: payload.parents_contact1,
    parentsContact2: payload.parents_contact2,
    admissionDate: payload.admission_date,
    gender: payload.gender,
    motherName: payload.mother_name,
    fatherName: payload.father_name,
    feeScholarship: payload.fee_scholarship,
    birthPlace: payload.birth_place,
    religion: payload.religion,
    address: payload.address,
    totalFees: payload.total_fees ?? 0,
    pendingFees: payload.pending_fees ?? 0,
    feeBreakdown: payload.fee_breakdown ?? null,
  });

  const populated = await Student.findById(student._id)
    .populate("class")
    .populate("branch")
    .populate("academicYear");

  res.status(StatusCodes.CREATED).json({
    success: true,
    student: formatStudent(populated),
  });
}

async function updateStudent(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const payload = req.body || {};
  const divisionNormalized = normalizeDivision(payload.division);

  const duplicate = await Student.findOne({
    _id: { $ne: id },
    class: payload.class_id,
    division: divisionNormalized,
    rollNumber: payload.roll_number,
  }).lean();

  if (duplicate) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Roll number already exists in this class/division.",
    });
  }

  const updates = {
    name: payload.name,
    rollNumber: payload.roll_number,
    class: payload.class_id,
    division: divisionNormalized,
    parentsContact1: payload.parents_contact1,
    parentsContact2: payload.parents_contact2,
    admissionDate: payload.admission_date,
    gender: payload.gender,
    motherName: payload.mother_name,
    fatherName: payload.father_name,
    feeScholarship: payload.fee_scholarship,
    birthPlace: payload.birth_place,
    religion: payload.religion,
    address: payload.address,
    totalFees: payload.total_fees ?? 0,
    pendingFees: payload.pending_fees ?? 0,
    feeBreakdown: payload.fee_breakdown ?? null,
  };

  if (payload.academic_year_id) {
    updates.academicYear = payload.academic_year_id;
  }

  if (payload.class_id) {
    const classroom = await Classroom.findById(payload.class_id).lean();
    if (classroom) {
      updates.branch = classroom.branch;
    }
  }

  const student = await Student.findByIdAndUpdate(id, updates, {
    new: true,
  })
    .populate("class")
    .populate("branch")
    .populate("academicYear");

  if (!student) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Student not found" });
  }

  res.json({ success: true, student: formatStudent(student) });
}

async function deleteStudent(req, res) {
  const { id } = req.params;

  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const student = await Student.findByIdAndDelete(id);
  if (!student) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Student not found" });
  }

  res.json({ success: true, id });
}

async function getNextRollNumber(req, res) {
  const { classId } = req.params;
  const division = normalizeDivision(req.query.division);
  const academicYearId = req.query.academicYearId;

  if (!classId || !division) {
    return res.json({ success: true, next: 1 });
  }

  const filter = {
    class: classId,
    division,
  };
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }

  const students = await Student.find(filter)
    .select("rollNumber")
    .lean();

  const maxRoll = students.reduce((acc, entry) => {
    const parsed = parseInt(entry.rollNumber, 10);
    if (!Number.isNaN(parsed) && parsed > acc) {
      return parsed;
    }
    return acc;
  }, 0);

  res.json({ success: true, next: maxRoll + 1 });
}

async function getNextRollNumberByEntry(req, res) {
  const { classEntryId } = req.params;
  const division = normalizeDivision(req.query.division);
  const academicYearId = req.query.academicYearId;

  if (!classEntryId || !division) {
    return res.json({ success: true, next: 1 });
  }

  const classroom = await Classroom.findById(classEntryId).lean();
  if (!classroom) {
    return res.json({ success: true, next: 1 });
  }

  const filter = {
    class: classroom._id,
    division,
  };
  if (academicYearId && academicYearId !== "all") {
    filter.academicYear = academicYearId;
  }

  const students = await Student.find(filter).select("rollNumber").lean();
  const maxRoll = students.reduce((acc, entry) => {
    const parsed = parseInt(entry.rollNumber, 10);
    if (!Number.isNaN(parsed) && parsed > acc) {
      return parsed;
    }
    return acc;
  }, 0);

  res.json({ success: true, next: maxRoll + 1 });
}

export {
  getStudents,
  getStudentsByTeacher,
  searchStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getNextRollNumber,
  getNextRollNumberByEntry,
  getStudentById,
};
