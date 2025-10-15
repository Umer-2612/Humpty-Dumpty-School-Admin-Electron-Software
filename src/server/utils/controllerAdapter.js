import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";

function buildQueryParams(searchParams) {
  const result = {};
  if (!searchParams) return result;

  // Collect all keys and handle duplicates by storing arrays
  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    if (values.length === 1) {
      result[key] = values[0];
    } else if (values.length > 1) {
      result[key] = values;
    }
  }

  return result;
}

export async function runController(controller, request, params = {}) {
  await connectToDatabase();

  const req = {
    params: params || {},
    query: buildQueryParams(request.nextUrl?.searchParams),
    body: null,
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    try {
      req.body = await request.json();
    } catch (error) {
      req.body = null;
    }
  }

  let statusCode = 200;
  let payload;
  let responded = false;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(data) {
      responded = true;
      payload = data;
      return data;
    },
  };

  try {
    await controller(req, res);
  } catch (error) {
    console.error("[API] Handler error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }

  if (!responded) {
    payload = payload ?? null;
  }

  return NextResponse.json(payload, { status: statusCode });
}
