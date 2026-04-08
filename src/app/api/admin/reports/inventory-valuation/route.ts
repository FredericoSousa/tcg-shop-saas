import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetInventoryValuationUseCase } from "@/lib/application/use-cases/get-inventory-valuation.use-case";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = context.tenant.id;

    const useCase = container.resolve(GetInventoryValuationUseCase);
    const report = await useCase.execute(tenantId);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error("[REPORTS_INVENTORY_VALUATION_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
