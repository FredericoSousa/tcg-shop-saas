import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { SaveProductUseCase } from "@/lib/application/use-cases/save-product.use-case";
import { logger } from "@/lib/logger";

const listProductsUseCase = container.resolve(ListProductsUseCase);
const saveProductUseCase = container.resolve(SaveProductUseCase);

export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 10;
      const search = searchParams.get("search") || undefined;
      const categoryId = searchParams.get("categoryId") || undefined;

      const result = await listProductsUseCase.execute({ page, limit, search, categoryId });
      return Response.json(result);
    } catch (error) {
      logger.error("Error fetching products", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const body = await request.json();
      const product = await saveProductUseCase.execute({ ...body });
      return Response.json(product);
    } catch (error) {
      logger.error("Error creating product", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
