import "reflect-metadata";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { withAdminApi } from "@/lib/tenant-server";

/**
 * @openapi
 * /api/tenant:
 *   get:
 *     summary: Get current authenticated tenant
 *     description: Returns the tenant associated with the current admin session. Does not allow lookup by arbitrary slug to prevent enumeration.
 *     tags: [Tenant]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current tenant
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    return ApiResponse.success(tenant);
  });
}
