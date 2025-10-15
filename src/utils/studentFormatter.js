export function formatStudent(doc) {
  if (!doc) return null;
  const obj =
    typeof doc.toObject === "function"
      ? doc.toObject({ virtuals: true })
      : { ...doc };

  const classDoc = obj.class || obj.classroom || obj.class_id;
  const branchDoc = obj.branch || (classDoc && classDoc.branch) || obj.branch_id;

  return {
    id: obj._id?.toString?.() || obj.id,
    name: obj.name,
    roll_number: obj.rollNumber ?? obj.roll_number,
    class_id: classDoc?._id?.toString?.() || classDoc?.id || obj.class_id,
    academic_year_id:
      obj.academicYear?._id?.toString?.() || obj.academic_year_id || null,
    total_fees: obj.totalFees ?? obj.total_fees ?? 0,
    pending_fees: obj.pendingFees ?? obj.pending_fees ?? 0,
    division: obj.division || "",
    parents_contact1: obj.parentsContact1 ?? obj.parents_contact1 ?? "",
    parents_contact2: obj.parentsContact2 ?? obj.parents_contact2 ?? "",
    admission_date: obj.admissionDate
      ? obj.admissionDate.toISOString().slice(0, 10)
      : obj.admission_date || null,
    gender: obj.gender || "",
    mother_name: obj.motherName ?? obj.mother_name ?? "",
    father_name: obj.fatherName ?? obj.father_name ?? "",
    fee_scholarship: obj.feeScholarship ?? obj.fee_scholarship ?? 0,
    birth_place: obj.birthPlace ?? obj.birth_place ?? "",
    religion: obj.religion || "",
    address: obj.address || "",
    created_at: obj.createdAt?.toISOString?.() || obj.created_at,
    class_name: classDoc?.name || obj.class_name || "",
    shift_name: classDoc?.shiftName || obj.shift_name || "",
    branch_name: branchDoc?.name || obj.branch_name || obj.branch?.name || "",
    branch_id:
      branchDoc?._id?.toString?.() ||
      branchDoc?.id ||
      obj.branch_id ||
      classDoc?.branch?.toString?.() ||
      null,
    fee_breakdown: obj.feeBreakdown ?? obj.fee_breakdown ?? null,
    months_paid: obj.monthsPaid ?? obj.months_paid ?? {},
  };
}

export function formatStudentList(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map(formatStudent);
}
