import { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetRevenueReportUseCase } from "@/lib/application/use-cases/get-revenue-report.use-case";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     description: Returns a revenue report for a given date range. Requires admin authentication.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *         description: End date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Revenue report
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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const useCase = container.resolve(GetRevenueReportUseCase);
    const report = await useCase.execute({ tenantId, startDate, endDate });

    return ApiResponse.success(report);
  } catch (error) {
    console.error("[REPORTS_REVENUE_GET]", error);
    return ApiResponse.serverError();
  }
}
