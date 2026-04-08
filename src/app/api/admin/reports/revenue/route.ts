import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetRevenueReportUseCase } from "@/lib/application/use-cases/get-revenue-report.use-case";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = context.tenant.id;

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const useCase = container.resolve(GetRevenueReportUseCase);
    const report = await useCase.execute({ tenantId, startDate, endDate });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("[REPORTS_REVENUE_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
