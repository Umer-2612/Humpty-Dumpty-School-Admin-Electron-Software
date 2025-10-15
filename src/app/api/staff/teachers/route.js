import { getTeachers } from "@/server/controllers/staffController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getTeachers, request);
}
