import { Schema, model, models } from "mongoose";

const SettingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      default: null,
    },
    category: {
      type: String,
      default: "general",
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

SettingSchema.index({ key: 1 }, { unique: true });

export default models.Setting || model("Setting", SettingSchema);
