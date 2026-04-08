import { NextRequest } from "next/server";
import {
  authenticateUser,
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Authenticates a user with username, password, and tenantId, and sets a session cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password, tenantId]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *               tenantId: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Missing required fields
 */
export async function POST(request: NextRequest) {
  try {
    const { username, password, tenantId } = await request.json();

    if (!username || !password || !tenantId) {
      return ApiResponse.badRequest("Username, password, and tenantId are required");
    }

    const session = await authenticateUser(username, password, tenantId);

    if (!session) {
      return ApiResponse.unauthorized("Invalid username or password");
    }

    const token = await createSessionToken(session);
    await setSessionCookie(token);

    return ApiResponse.success({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return ApiResponse.serverError("An error occurred during login");
  }
}
