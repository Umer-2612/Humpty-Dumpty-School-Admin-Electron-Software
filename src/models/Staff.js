import { Schema, model, models } from "mongoose";

const AssignmentSchema = new Schema(
  {
    class: {
      type: Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    division: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const StaffSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    staffType: {
      type: String,
      enum: ["teacher", "office"],
      default: "teacher",
      index: true,
    },
    role: {
      type: String,
      trim: true,
    },
    assignments: {
      type: [AssignmentSchema],
      default: [],
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

StaffSchema.index({ name: 1 });

export default models.Staff || model("Staff", StaffSchema);
