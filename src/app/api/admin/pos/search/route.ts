import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { logger } from "@/lib/logger";

const listProductsUseCase = container.resolve(ListProductsUseCase);

export async function GET(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || "";
  
  const limit = 20;
  const page = 1;

  try {
    const result = await listProductsUseCase.execute({ tenantId: tenant.id, page, limit, search });
    return Response.json(result.items);
  } catch (error) {
    logger.error("Error in POS search API", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
