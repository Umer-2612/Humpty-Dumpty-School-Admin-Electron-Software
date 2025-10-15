import { setActiveAcademicYear } from "@/server/controllers/academicYearController";
import { runController } from "@/server/utils/controllerAdapter";

export async function POST(request, context) {
  return runController(setActiveAcademicYear, request, context.params);
}
