import {
  updateClass,
  deleteClass,
} from "@/server/controllers/classController";
import { runController } from "@/server/utils/controllerAdapter";

export async function PUT(request, context) {
  return runController(updateClass, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteClass, request, context.params);
}
