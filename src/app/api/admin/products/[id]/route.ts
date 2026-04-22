import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { withAdminApi } from "@/lib/tenant-server";
import { container, TOKENS } from "@/lib/infrastructure/container";
import { GetProductUseCase } from "@/lib/application/use-cases/get-product.use-case";
import { SaveProductUseCase } from "@/lib/application/use-cases/save-product.use-case";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const getProductUseCase = container.resolve(GetProductUseCase);
      const product = await getProductUseCase.execute(id);
      if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
      return Response.json(product);
    } catch (error) {
      logger.error("Error fetching product", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const saveProductUseCase = container.resolve(SaveProductUseCase);
      const product = await saveProductUseCase.execute({ ...body, id });
      revalidateTag(`tenant-${tenant.id}-products`);
      return Response.json(product);
    } catch (error) {
      logger.error("Error updating product", error as Error, { tenantId: tenant.id });
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
      await productRepo.update(id, { deletedAt: new Date(), active: false });
      revalidateTag(`tenant-${tenant.id}-products`);
      return Response.json({ success: true });
    } catch (error) {
      logger.error("Error deleting product", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
