import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/pos/search:
 *   get:
 *     summary: Search products for POS
 *     description: Searches for products in the catalog for the POS system. Requires admin authentication.
 *     tags: [POS]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const search = searchParams.get("q") || "";
      
      const limit = 20;
      const page = 1;

      const listProductsUseCase = container.resolve(ListProductsUseCase);
      const result = await listProductsUseCase.execute({ page, limit, search });
      return ApiResponse.success(result.items);
    } catch (error) {
      logger.error("Error in POS search API", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
