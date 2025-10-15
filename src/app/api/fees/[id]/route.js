import { updateFee, deleteFee } from "@/server/controllers/feesController";
import { runController } from "@/server/utils/controllerAdapter";

export async function PUT(request, context) {
  return runController(updateFee, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteFee, request, context.params);
}
