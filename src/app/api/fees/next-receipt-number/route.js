import { getNextReceiptNumberHandler } from "@/server/controllers/feesController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getNextReceiptNumberHandler, request);
}
