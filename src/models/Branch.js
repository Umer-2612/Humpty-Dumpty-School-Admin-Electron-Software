import { Schema, model, models } from "mongoose";

const BranchSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

BranchSchema.index({ name: 1 }, { unique: true });

export default models.Branch || model("Branch", BranchSchema);
