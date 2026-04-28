import { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetTopSellingProductsUseCase } from "@/lib/application/use-cases/reports/get-top-selling-products.use-case";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/reports/top-products:
 *   get:
 *     summary: Get top selling products
 *     description: Returns a list of top selling products. Requires admin authentication.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: List of top products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return ApiResponse.unauthorized();
    }
    const tenantId = context.tenant.id;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const useCase = container.resolve(GetTopSellingProductsUseCase);
    const topProducts = await useCase.execute({ tenantId, limit });

    return ApiResponse.success(topProducts);
  } catch (error) {
    console.error("[REPORTS_TOP_PRODUCTS_GET]", error);
    return ApiResponse.serverError();
  }
}
