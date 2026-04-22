import { NextRequest, NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { GetStorefrontProductsUseCase } from "@/lib/application/use-cases/get-storefront-products.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

const useCase = new GetStorefrontProductsUseCase();

export async function GET(request: NextRequest) {
  const tenant = await getTenant();

  if (!tenant) {
    return ApiResponse.unauthorized("Tenant não identificado");
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  const result = await useCase.execute(tenant.id, { search, categoryId });

  return NextResponse.json({ success: true, data: result });
}
