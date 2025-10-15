import {
  listAcademicYears,
  createAcademicYear,
} from "@/server/controllers/academicYearController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(listAcademicYears, request);
}

export async function POST(request) {
  return runController(createAcademicYear, request);
}
