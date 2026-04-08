import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListOrdersUseCase } from "@/lib/application/use-cases/list-orders.use-case";
import { OrderStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;
      const source = (searchParams.get("source") as "POS" | "ECOMMERCE" | "all") || "all";
      const status = (searchParams.get("status") as OrderStatus | "all") || "all";
      const customerPhone = searchParams.get("customerPhone") || undefined;

      const listOrdersUseCase = container.resolve(ListOrdersUseCase);
      const result = await listOrdersUseCase.execute({
        page,
        limit,
        filters: { search, source, status, customerPhone }
      });

      return Response.json(result);
    } catch (error: unknown) {
      logger.error("Error in list orders API", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
