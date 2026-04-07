import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { PrismaProductRepository } from "@/lib/infrastructure/repositories/prisma-product.repository";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { SaveProductUseCase } from "@/lib/application/use-cases/save-product.use-case";
import { logger } from "@/lib/logger";

const productRepo = new PrismaProductRepository();
const listProductsUseCase = new ListProductsUseCase(productRepo);
const saveProductUseCase = new SaveProductUseCase(productRepo);

export async function GET(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;

    const result = await listProductsUseCase.execute({ tenantId: tenant.id, page, limit, search, categoryId });
    return Response.json(result);
  } catch (error) {
    logger.error("Error fetching products", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const body = await request.json();
    const product = await saveProductUseCase.execute({ ...body, tenantId: tenant.id });
    return Response.json(product);
  } catch (error) {
    logger.error("Error creating product", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
