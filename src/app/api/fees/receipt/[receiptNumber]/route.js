import { getFeeReceipt } from "@/server/controllers/feesController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getFeeReceipt, request, {
    receiptNumber: context.params.receiptNumber,
  });
}
