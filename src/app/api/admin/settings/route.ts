import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { UpdateSettingsUseCase } from "@/lib/application/use-cases/settings-users.use-case";
import { logger } from "@/lib/logger";

export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      return Response.json(tenant);
    } catch (error) {
      logger.error("Error fetching tenant settings", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const data = await request.json();
      const updateSettingsUseCase = container.resolve(UpdateSettingsUseCase);
      const updatedTenant = await updateSettingsUseCase.execute(tenant.id, data);
      return Response.json(updatedTenant);
    } catch (error) {
      logger.error("Error updating tenant settings", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
