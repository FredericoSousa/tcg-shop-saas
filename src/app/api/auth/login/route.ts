import { NextRequest, NextResponse } from "next/server";
import {
  authenticateUser,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password, tenantId } = await request.json();

    if (!username || !password || !tenantId) {
      return NextResponse.json(
        { error: "Username, password, and tenantId are required" },
        { status: 400 },
      );
    }

    const session = await authenticateUser(username, password, tenantId);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const token = await createSessionToken(session);
    await setSessionCookie(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
