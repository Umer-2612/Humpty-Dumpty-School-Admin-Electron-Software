import { searchStudents } from "@/server/controllers/studentController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(searchStudents, request);
}
