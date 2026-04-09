import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListOrdersUseCase } from "@/lib/application/use-cases/list-orders.use-case";
import { OrderStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/orders:
 *   get:
 *     summary: List orders
 *     description: Returns a paginated list of orders. Requires admin authentication.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: source
 *         schema: { type: string, enum: [POS, ECOMMERCE, all], default: all }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, PENDING, PAID, SHIPPED, CANCELLED], default: all }
 *       - in: query
 *         name: customerPhone
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;
      const source = (searchParams.get("source")?.toUpperCase() as "POS" | "ECOMMERCE" | "all") || "all";
      const status = (searchParams.get("status")?.toUpperCase() as OrderStatus | "all") || "all";
      const customerPhone = searchParams.get("customerPhone") || undefined;

      const listOrdersUseCase = container.resolve(ListOrdersUseCase);
      const result = await listOrdersUseCase.execute({
        page,
        limit,
        filters: { search, source, status, customerPhone }
      });

      return ApiResponse.success(result);
    } catch (error: unknown) {
      logger.error("Error in list orders API", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
