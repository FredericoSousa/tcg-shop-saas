import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { PrismaTenantRepository } from "@/lib/infrastructure/repositories/prisma-tenant.repository";
import { UpdateSettingsUseCase } from "@/lib/application/use-cases/settings-users.use-case";
import { logger } from "@/lib/logger";

const tenantRepo = new PrismaTenantRepository();
const updateSettingsUseCase = new UpdateSettingsUseCase(tenantRepo);

export async function GET() {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    return Response.json(tenant);
  } catch (error) {
    logger.error("Error fetching tenant settings", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const data = await request.json();
    const updatedTenant = await updateSettingsUseCase.execute(tenant.id, data);
    return Response.json(updatedTenant);
  } catch (error) {
    logger.error("Error updating tenant settings", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
