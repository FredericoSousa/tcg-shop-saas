import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("q") || "";
      
      const limit = 20;
      const page = 1;

      const listProductsUseCase = container.resolve(ListProductsUseCase);
      const result = await listProductsUseCase.execute({ page, limit, search });
      return Response.json(result.items);
    } catch (error) {
      logger.error("Error in POS search API", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
