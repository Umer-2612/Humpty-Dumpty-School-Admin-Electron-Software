import { getActiveAcademicYear } from "@/server/controllers/academicYearController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getActiveAcademicYear, request);
}
