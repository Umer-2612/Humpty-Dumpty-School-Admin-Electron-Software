import { Schema, model, models } from "mongoose";

const TransportSchema = new Schema(
  {
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverRoute: {
      type: String,
      required: true,
      trim: true,
    },
    driverCar: {
      type: String,
      required: true,
      trim: true,
    },
    driverCarNumber: {
      type: String,
      required: true,
      trim: true,
    },
    driverContact: {
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

TransportSchema.index({ driverCarNumber: 1 }, { unique: true });

export default models.Transport || model("Transport", TransportSchema);
