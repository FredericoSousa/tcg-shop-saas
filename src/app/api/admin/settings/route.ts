import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { UpdateSettingsUseCase } from "@/lib/application/use-cases/update-settings.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/settings:
 *   get:
 *     summary: Get tenant settings
 *     description: Returns current tenant settings. Requires admin authentication.
 *     tags: [Settings]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Tenant settings
 *   patch:
 *     summary: Update tenant settings
 *     description: Updates current tenant settings. Requires admin authentication.
 *     tags: [Settings]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      return ApiResponse.success(tenant);
    } catch (error) {
      logger.error("Error fetching tenant settings", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const data = await request.json();
      const updateSettingsUseCase = container.resolve(UpdateSettingsUseCase);
      const updatedTenant = await updateSettingsUseCase.execute({ id: tenant.id, data });
      return ApiResponse.success(updatedTenant);
    } catch (error) {
      logger.error("Error updating tenant settings", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
