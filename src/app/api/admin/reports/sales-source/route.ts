import { NextRequest } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetSalesSourceReportUseCase } from "@/lib/application/use-cases/reports/get-sales-source-report.use-case";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/reports/sales-source:
 *   get:
 *     summary: Get sales source report
 *     description: Returns a report of sales broken down by source (e.g., POS, Online). Requires admin authentication.
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Sales source report
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
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const useCase = container.resolve(GetSalesSourceReportUseCase);
    const report = await useCase.execute({ tenantId, startDate, endDate });

    return ApiResponse.success(report);
  } catch (error) {
    console.error("[REPORTS_SALES_SOURCE_GET]", error);
    return ApiResponse.serverError();
  }
}
