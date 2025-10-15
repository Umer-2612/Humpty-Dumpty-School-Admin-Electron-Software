import { StatusCodes } from "http-status-codes";
import { Transport } from "@/models";

function formatTransport(doc) {
  if (!doc) return null;
  const obj =
    typeof doc.toObject === "function"
      ? doc.toObject({ virtuals: true })
      : { ...doc };
  return {
    id: obj._id?.toString?.() || obj.id,
    driver_name: obj.driverName,
    driver_route: obj.driverRoute,
    driver_car: obj.driverCar,
    driver_car_number: obj.driverCarNumber,
    driver_contact: obj.driverContact,
    created_at: obj.createdAt?.toISOString?.() || obj.created_at,
  };
}

function formatTransportList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(formatTransport);
}

export async function getTransport(req, res) {
  const entries = await Transport.find().sort({ createdAt: -1 });
  res.json(formatTransportList(entries));
}

export async function createTransport(req, res) {
  const payload = req.body || {};
  try {
    const transport = await Transport.create({
      driverName: payload.driver_name,
      driverRoute: payload.driver_route,
      driverCar: payload.driver_car,
      driverCarNumber: payload.driver_car_number,
      driverContact: payload.driver_contact,
    });
    res
      .status(StatusCodes.CREATED)
      .json({ success: true, transport: formatTransport(transport) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: "Car number already exists. Please use a unique car number.",
      });
    }
    throw error;
  }
}

export async function updateTransport(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const payload = req.body || {};

  try {
    const transport = await Transport.findByIdAndUpdate(
      id,
      {
        driverName: payload.driver_name,
        driverRoute: payload.driver_route,
        driverCar: payload.driver_car,
        driverCarNumber: payload.driver_car_number,
        driverContact: payload.driver_contact,
      },
      { new: true, runValidators: true }
    );

    if (!transport) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, error: "Transport entry not found" });
    }

    res.json({ success: true, transport: formatTransport(transport) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        error: "Car number already exists. Please use a unique car number.",
      });
    }
    throw error;
  }
}

export async function deleteTransport(req, res) {
  const { id } = req.params;
  if (!id) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ success: false, error: "id is required" });
  }

  const result = await Transport.findByIdAndDelete(id);
  if (!result) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, error: "Transport entry not found" });
  }

  res.json({ success: true, id });
}
