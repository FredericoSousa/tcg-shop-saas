import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { PrismaProductRepository } from "@/lib/infrastructure/repositories/prisma-product.repository";
import { GetProductUseCase } from "@/lib/application/use-cases/get-product.use-case";
import { SaveProductUseCase } from "@/lib/application/use-cases/save-product.use-case";
import { logger } from "@/lib/logger";

const productRepo = new PrismaProductRepository();
const getProductUseCase = new GetProductUseCase(productRepo);
const saveProductUseCase = new SaveProductUseCase(productRepo);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const product = await getProductUseCase.execute(id, tenant.id);
    if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
    return Response.json(product);
  } catch (error) {
    logger.error("Error fetching product", error as Error, { tenantId: tenant.id, productId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const product = await saveProductUseCase.execute({ ...body, id, tenantId: tenant.id });
    return Response.json(product);
  } catch (error) {
    logger.error("Error updating product", error as Error, { tenantId: tenant.id, productId: id });
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
    await productRepo.update(id, tenant.id, { deletedAt: new Date(), active: false });
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error deleting product", error as Error, { tenantId: tenant.id, productId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
