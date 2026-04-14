import { container } from "@/lib/infrastructure/container";
import { GetMonthlyRevenueTrendUseCase } from "@/lib/application/use-cases/get-monthly-revenue-trend.use-case";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/reports/monthly-trend:
 *   get:
 *     summary: Get monthly revenue trend report
 *     description: Returns a trend of revenue over the last few months. Requires admin authentication.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Monthly revenue trend report
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function GET() {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return ApiResponse.unauthorized();
    }
    const tenantId = context.tenant.id;

    const useCase = container.resolve(GetMonthlyRevenueTrendUseCase);
    const report = await useCase.execute(tenantId);

    return ApiResponse.success(report);
  } catch (error) {
    console.error("[REPORTS_MONTHLY_TREND_GET]", error);
    return ApiResponse.serverError();
  }
}
