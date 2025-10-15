import { getFees, createFee } from "@/server/controllers/feesController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getFees, request);
}

export async function POST(request) {
  return runController(createFee, request);
}
