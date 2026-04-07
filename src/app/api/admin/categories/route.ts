import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { PrismaProductRepository } from "@/lib/infrastructure/repositories/prisma-product.repository";
import { ListCategoriesUseCase } from "@/lib/application/use-cases/list-categories.use-case";
import { SaveCategoryUseCase } from "@/lib/application/use-cases/save-category.use-case";
import { logger } from "@/lib/logger";

const productRepo = new PrismaProductRepository();
const listCategoriesUseCase = new ListCategoriesUseCase(productRepo);
const saveCategoryUseCase = new SaveCategoryUseCase(productRepo);

export async function GET() {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const categories = await listCategoriesUseCase.execute(tenant.id);
    return Response.json(categories);
  } catch (error) {
    logger.error("Error fetching categories", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const body = await request.json();
    const category = await saveCategoryUseCase.execute({ ...body, tenantId: tenant.id });
    return Response.json(category);
  } catch (error) {
    logger.error("Error creating category", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
