import { getStudentTermSummary } from "@/server/controllers/feesController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getStudentTermSummary, request, {
    studentId: context.params.studentId,
  });
}
