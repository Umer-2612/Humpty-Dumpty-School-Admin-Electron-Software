import {
  getStudents,
  createStudent,
} from "@/server/controllers/studentController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getStudents, request);
}

export async function POST(request) {
  return runController(createStudent, request);
}
