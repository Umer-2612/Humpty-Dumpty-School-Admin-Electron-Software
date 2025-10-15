import { Schema, model, models } from "mongoose";

const FeeSchema = new Schema(
  {
    term1: { type: Number, default: 0 },
    term2: { type: Number, default: 0 },
    books: { type: Number, default: 0 },
  },
  { _id: false }
);

const ClassroomSchema = new Schema(
  {
    branch: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    shiftName: {
      type: String,
      default: "",
      trim: true,
    },
    startTime: {
      type: String,
      default: "",
    },
    endTime: {
      type: String,
      default: "",
    },
    term1Fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    term2Fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    booksCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    divisionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    fees: {
      type: FeeSchema,
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

ClassroomSchema.index(
  { branch: 1, name: 1, shiftName: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

export default models.Classroom || model("Classroom", ClassroomSchema);
