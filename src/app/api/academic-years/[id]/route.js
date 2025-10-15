import {
  updateAcademicYear,
  deleteAcademicYear,
} from "@/server/controllers/academicYearController";
import { runController } from "@/server/utils/controllerAdapter";

export async function PUT(request, context) {
  return runController(updateAcademicYear, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteAcademicYear, request, context.params);
}
