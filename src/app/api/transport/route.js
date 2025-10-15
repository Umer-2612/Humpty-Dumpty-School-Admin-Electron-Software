import {
  getTransport,
  createTransport,
} from "@/server/controllers/transportController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request) {
  return runController(getTransport, request);
}

export async function POST(request) {
  return runController(createTransport, request);
}
