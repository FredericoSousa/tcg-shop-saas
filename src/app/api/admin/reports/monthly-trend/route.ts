import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetMonthlyRevenueTrendUseCase } from "@/lib/application/use-cases/get-monthly-revenue-trend.use-case";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = context.tenant.id;

    const useCase = container.resolve(GetMonthlyRevenueTrendUseCase);
    const report = await useCase.execute(tenantId);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("[REPORTS_MONTHLY_TREND_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
