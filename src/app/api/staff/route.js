import {
  getStaff,
  createStaff,
} from "@/server/controllers/staffController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getStaff, request);
}

export async function POST(request) {
  return runController(createStaff, request);
}
