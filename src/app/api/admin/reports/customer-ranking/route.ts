import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetCustomerRankingUseCase } from "@/lib/application/use-cases/get-customer-ranking.use-case";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = context.tenant.id;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const useCase = container.resolve(GetCustomerRankingUseCase);
    const report = await useCase.execute({ tenantId, limit });

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("[REPORTS_CUSTOMER_RANKING_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
