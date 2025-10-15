import {
  listClassesByBranch,
  createClass,
} from "@/server/controllers/classController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(listClassesByBranch, request, {
    branchId: context.params.branchId,
  });
}

export async function POST(request, context) {
  return runController(createClass, request, {
    branchId: context.params.branchId,
  });
}
