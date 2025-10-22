import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import {
  ensureDefaultAdminUser,
  verifyUserCredentials,
} from "@/server/services/userService";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/server/utils/session";

export async function POST(request) {
  await connectToDatabase();
  await ensureDefaultAdminUser();

  let credentials;
  try {
    credentials = await request.json();
  } catch (error) {
    credentials = {};
  }

  const username = credentials?.username?.toString().trim();
  const password = credentials?.password?.toString();

  if (!username || !password) {
    return NextResponse.json(
      {
        success: false,
        message: "Username and password are required.",
      },
      { status: 400 }
    );
  }

  try {
    const user = await verifyUserCredentials(username, password);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid username or password.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: { username: user.username },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: createSessionToken(user),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error while logging in.",
      },
      { status: 500 }
    );
  }
}
