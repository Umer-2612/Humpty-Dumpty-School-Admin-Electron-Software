import { getNextRollNumber } from "@/server/controllers/studentController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getNextRollNumber, request, {
    classId: context.params.classId,
  });
}
