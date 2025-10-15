import { getStudentMonthsStatus } from "@/server/controllers/feesController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getStudentMonthsStatus, request, {
    studentId: context.params.studentId,
  });
}
