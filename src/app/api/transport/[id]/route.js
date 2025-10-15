import {
  updateTransport,
  deleteTransport,
} from "@/server/controllers/transportController";
import { runController } from "@/server/utils/controllerAdapter";

export async function PUT(request, context) {
  return runController(updateTransport, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteTransport, request, context.params);
}
