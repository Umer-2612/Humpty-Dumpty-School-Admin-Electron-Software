import {
  listBranches,
  createBranch,
} from "@/server/controllers/branchController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(listBranches, request);
}

export async function POST(request) {
  return runController(createBranch, request);
}
