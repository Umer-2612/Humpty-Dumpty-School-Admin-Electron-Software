import { StatusCodes } from "http-status-codes";
import { Setting } from "@/models";

export async function getSetting(req, res) {
  const { key } = req.params;
  if (!key) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "key is required" });
  }

  const setting = await Setting.findOne({ key }).lean();
  res.json(setting?.value ?? null);
}

export async function setSetting(req, res) {
  const { key } = req.params;
  if (!key) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "key is required" });
  }

  const payload = req.body ?? null;
  await Setting.findOneAndUpdate(
    { key },
    { value: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  res.json({ success: true });
}
