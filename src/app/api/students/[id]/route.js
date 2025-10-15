import {
  getStudentById,
  updateStudent,
  deleteStudent,
} from "@/server/controllers/studentController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getStudentById, request, context.params);
}

export async function PUT(request, context) {
  return runController(updateStudent, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteStudent, request, context.params);
}
