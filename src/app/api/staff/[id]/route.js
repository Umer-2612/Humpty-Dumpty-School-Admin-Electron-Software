import {
  getStaffById,
  updateStaff,
  deleteStaff,
} from "@/server/controllers/staffController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getStaffById, request, context.params);
}

export async function PUT(request, context) {
  return runController(updateStaff, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteStaff, request, context.params);
}
