import { Schema, model, models } from "mongoose";

const FeeSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentType: {
      type: String,
      enum: ["cash", "bank"],
      required: true,
      index: true,
    },
    chequeNumber: {
      type: String,
      trim: true,
    },
    chequeDate: {
      type: Date,
    },
    bankName: {
      type: String,
      trim: true,
    },
    payeeName: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    academicYearLabel: {
      type: String,
      trim: true,
    },
    monthYear: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    feeTerm: {
      type: String,
      trim: true,
    },
    feeCharge: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

FeeSchema.index({ receiptNumber: 1 }, { unique: true });
FeeSchema.index({ branch: 1, academicYear: 1, paymentDate: -1 });

export default models.Fee || model("Fee", FeeSchema);
