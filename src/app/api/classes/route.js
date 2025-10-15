import { listAllClasses } from "@/server/controllers/classController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(listAllClasses, request);
}
