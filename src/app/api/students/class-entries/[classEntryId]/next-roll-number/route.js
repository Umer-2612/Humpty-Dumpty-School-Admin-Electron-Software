import { getNextRollNumberByEntry } from "@/server/controllers/studentController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getNextRollNumberByEntry, request, {
    classEntryId: context.params.classEntryId,
  });
}
