import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { clearSessionCookie } from "@/lib/auth";

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Clears the session cookie.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function POST() {
  try {
    await clearSessionCookie();
    return ApiResponse.success({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return ApiResponse.serverError("An error occurred during logout");
  }
}
