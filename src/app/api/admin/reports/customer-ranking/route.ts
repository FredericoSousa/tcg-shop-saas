import { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetCustomerRankingUseCase } from "@/lib/application/use-cases/get-customer-ranking.use-case";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/reports/customer-ranking:
 *   get:
 *     summary: Get customer ranking report
 *     description: Returns a ranking of top customers by revenue. Requires admin authentication.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 5 }
 *     responses:
 *       200:
 *         description: Customer ranking report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return ApiResponse.unauthorized();
    }
    const tenantId = context.tenant.id;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const useCase = container.resolve(GetCustomerRankingUseCase);
    const report = await useCase.execute({ tenantId, limit });

    return ApiResponse.success(report);
  } catch (error) {
    console.error("[REPORTS_CUSTOMER_RANKING_GET]", error);
    return ApiResponse.serverError();
  }
}
