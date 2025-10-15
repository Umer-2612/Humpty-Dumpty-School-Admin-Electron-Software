import { getSetting, setSetting } from "@/server/controllers/settingController";
import { runController } from "@/server/utils/controllerAdapter";

export async function GET(request, context) {
  return runController(getSetting, request, context.params);
}

export async function PUT(request, context) {
  return runController(setSetting, request, context.params);
}
