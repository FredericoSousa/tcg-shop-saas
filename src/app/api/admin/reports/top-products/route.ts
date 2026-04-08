import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { GetTopSellingProductsUseCase } from "@/lib/application/use-cases/get-top-selling-products.use-case";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET(req: NextRequest) {
  try {
    const context = await validateAdminApi();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const tenantId = context.tenant.id;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const useCase = container.resolve(GetTopSellingProductsUseCase);
    const topProducts = await useCase.execute({ tenantId, limit });

    return NextResponse.json(topProducts);
  } catch (error) {
    console.error("[REPORTS_TOP_PRODUCTS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
