import { Schema, model, models } from "mongoose";

const MonthEntrySchema = new Schema(
  {
    amount: { type: Number, default: 0 },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "paid",
    },
  },
  { _id: false }
);

const StudentSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    class: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    division: {
      type: String,
      trim: true,
    },
    parentsContact1: {
      type: String,
      trim: true,
    },
    parentsContact2: {
      type: String,
      trim: true,
    },
    admissionDate: {
      type: Date,
    },
    gender: {
      type: String,
      trim: true,
    },
    motherName: {
      type: String,
      trim: true,
    },
    fatherName: {
      type: String,
      trim: true,
    },
    feeScholarship: {
      type: Number,
      default: 0,
      min: 0,
    },
    birthPlace: {
      type: String,
      trim: true,
    },
    religion: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    totalFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingFees: {
      type: Number,
      default: 0,
      min: 0,
    },
    feeBreakdown: {
      type: Schema.Types.Mixed,
      default: null,
    },
    monthsPaid: {
      type: Map,
      of: MonthEntrySchema,
      default: () => ({}),
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

StudentSchema.index(
  { branch: 1, class: 1, division: 1, rollNumber: 1 },
  { unique: true, sparse: true }
);

export default models.Student || model("Student", StudentSchema);
