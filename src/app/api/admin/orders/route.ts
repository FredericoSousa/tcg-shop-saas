import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListOrdersUseCase } from "@/lib/application/use-cases/orders/list-orders.use-case";
import { ordersQuerySchema, parseSearchParams } from "@/lib/validation/schemas";
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
  return withAdminApi(async () => {
    const { page, limit, search, source, status, customerPhone } = parseSearchParams(
      request.nextUrl.searchParams,
      ordersQuerySchema,
    );

    const listOrdersUseCase = container.resolve(ListOrdersUseCase);
    const result = await listOrdersUseCase.execute({
      page,
      limit,
      filters: { search, source, status, customerPhone }
    });

    return ApiResponse.success(result);
  });
}

