import {
  updateBranch,
  deleteBranch,
} from "@/server/controllers/branchController";
import { runController } from "@/server/utils/controllerAdapter";

export async function PUT(request, context) {
  return runController(updateBranch, request, context.params);
}

export async function DELETE(request, context) {
  return runController(deleteBranch, request, context.params);
}
