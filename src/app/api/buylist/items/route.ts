import { getTenant } from "@/lib/tenant-server"
import { container } from "@/lib/infrastructure/container";
import { ListBuylistItemsUseCase } from "@/lib/application/use-cases/list-buylist-items.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { logger } from "@/lib/logger";

const listItemsUseCase = container.resolve(ListBuylistItemsUseCase);

export async function GET() {
  const tenant = await getTenant();
  
  if (!tenant) {
    return ApiResponse.badRequest("Tenant não identificado");
  }

  try {
    const items = await listItemsUseCase.execute(tenant.id);
    // Only return active items for the storefront
    return ApiResponse.success(items.filter(item => item.active));
  } catch (error) {
    logger.error("Error fetching public buylist items", error as Error, { tenantId: tenant.id });
    return ApiResponse.serverError();
  }
}
