import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { container, TOKENS } from "@/lib/infrastructure/container";
import { SaveCategoryUseCase } from "@/lib/application/use-cases/save-category.use-case";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { logger } from "@/lib/logger";

const saveCategoryUseCase = container.resolve(SaveCategoryUseCase);
const productRepo = container.resolve<IProductRepository>(TOKENS.ProductRepository);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const body = await request.json();
    const category = await saveCategoryUseCase.execute({ ...body, id, tenantId: tenant.id });
    return Response.json(category);
  } catch (error) {
    logger.error("Error updating category", error as Error, { tenantId: tenant.id, categoryId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    await productRepo.updateCategory(id, tenant.id, { deletedAt: new Date() });
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error deleting category", error as Error, { tenantId: tenant.id, categoryId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
