import { NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetInventoryReportUseCase } from "@/lib/application/use-cases/get-inventory-report.use-case";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET() {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = context.tenant.id;

    const useCase = container.resolve(GetInventoryReportUseCase);
    const report = await useCase.execute(tenantId);

    return NextResponse.json(report);
  } catch (error) {
    console.error("[REPORTS_INVENTORY_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
