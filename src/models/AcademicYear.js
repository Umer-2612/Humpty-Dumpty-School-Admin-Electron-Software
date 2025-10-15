import { Schema, model, models } from "mongoose";

const AcademicYearSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

AcademicYearSchema.index({ name: 1 }, { unique: true });

export default models.AcademicYear || model("AcademicYear", AcademicYearSchema);
