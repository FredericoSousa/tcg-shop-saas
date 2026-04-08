import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container, TOKENS } from "@/lib/infrastructure/container";
import { SaveCategoryUseCase } from "@/lib/application/use-cases/save-category.use-case";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { logger } from "@/lib/logger";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const saveCategoryUseCase = container.resolve(SaveCategoryUseCase);
      const category = await saveCategoryUseCase.execute({ ...body, id });
      return Response.json(category);
    } catch (error) {
      logger.error("Error updating category", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const productRepo = container.resolve<IProductRepository>(TOKENS.ProductRepository);
      await productRepo.updateCategory(id, { deletedAt: new Date() });
      return Response.json({ success: true });
    } catch (error) {
      logger.error("Error deleting category", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
