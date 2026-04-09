import { getTenant } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/tenant/current:
 *   get:
 *     summary: Get current tenant
 *     description: Returns the details of the current tenant based on the hostname.
 *     tags: [Tenant]
 *     responses:
 *       200:
 *         description: Current tenant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Tenant not found
 */
export async function GET() {
  try {
    const tenant = await getTenant();

    if (!tenant) {
      return ApiResponse.notFound("Tenant not found");
    }

    return ApiResponse.success({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
    });
  } catch (error) {
    console.error("Error fetching current tenant:", error);
    return ApiResponse.serverError();
  }
}
