import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListOrdersUseCase } from "@/lib/application/use-cases/list-orders.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");

      const listOrdersUseCase = container.resolve(ListOrdersUseCase);
      const result = await listOrdersUseCase.execute({
        page,
        limit,
        filters: {
          customerId: id
        }
      });
      
      return ApiResponse.success(result);
    } catch (error) {
      logger.error("Error fetching customer orders", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
