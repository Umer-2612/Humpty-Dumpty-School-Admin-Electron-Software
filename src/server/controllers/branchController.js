import { StatusCodes } from "http-status-codes";
import { Branch, Classroom, Fee, Student } from "@/models";
import { toClientDoc, toClientList } from "@/utils/formatter";

const normalizeName = (name) => (name || "").toString().trim();

export async function listBranches(req, res) {
  const branches = await Branch.find().sort({ name: 1 }).lean();
  res.json(toClientList(branches));
}

export async function createBranch(req, res) {
  const { name, sourceBranchId } = req.body || {};
  const trimmed = normalizeName(name);

  if (!trimmed) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Branch name is required" });
  }

  const existing = await Branch.findOne({
    name: { $regex: `^${trimmed}$`, $options: "i" },
  }).lean();
  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Branch with this name already exists",
    });
  }

  const branch = await Branch.create({ name: trimmed });

  const sourceId = sourceBranchId ? String(sourceBranchId) : null;
  let copiedClasses = 0;
  if (sourceId) {
    const sourceBranch = await Branch.findById(sourceId);
    if (sourceBranch) {
      const sourceClasses = await Classroom.find({
        branch: sourceBranch._id,
      }).lean();
      if (sourceClasses.length > 0) {
        const documents = sourceClasses.map((entry) => ({
          branch: branch._id,
          name: entry.name,
          shiftName: entry.shiftName,
          startTime: entry.startTime,
          endTime: entry.endTime,
          term1Fee: entry.term1Fee,
          term2Fee: entry.term2Fee,
          booksCharge: entry.booksCharge,
          divisionCount: entry.divisionCount,
          fees: entry.fees,
        }));
        const inserted = await Classroom.insertMany(documents);
        copiedClasses = inserted.length;
      }
    }
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    branch: toClientDoc(branch),
    copiedClasses,
  });
}

export async function updateBranch(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};

  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Branch id is required" });
  }

  const trimmed = normalizeName(name);
  if (!trimmed) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Branch name is required" });
  }

  const duplicate = await Branch.findOne({
    _id: { $ne: id },
    name: { $regex: `^${trimmed}$`, $options: "i" },
  }).lean();

  if (duplicate) {
    return res.status(StatusCodes.CONFLICT).json({
      success: false,
      error: "Another branch with this name already exists",
    });
  }

  const branch = await Branch.findByIdAndUpdate(
    id,
    { name: trimmed },
    { new: true }
  );

  if (!branch) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Branch not found" });
  }

  res.json({ success: true, branch: toClientDoc(branch) });
}

export async function deleteBranch(req, res) {
  const { id } = req.params;

  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "Branch id is required" });
  }

  const branch = await Branch.findById(id);
  if (!branch) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Branch not found" });
  }

  const classCount = await Classroom.countDocuments({ branch: branch._id });
  if (classCount > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Cannot delete branch while classes are assigned to it",
    });
  }

  const studentCount = await Student.countDocuments({ branch: branch._id });
  if (studentCount > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Cannot delete branch while students exist for it",
    });
  }

  const feeCount = await Fee.countDocuments({ branch: branch._id });
  if (feeCount > 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: "Cannot delete branch while fee records exist for it",
    });
  }

  await branch.deleteOne();

  res.json({ success: true, id: branch._id.toString() });
}
