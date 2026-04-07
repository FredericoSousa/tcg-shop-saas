import { updateProduct, deleteProduct, getProductById } from "@/lib/services/product.service";
import { validateAdminApi } from "@/lib/tenant-server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const product = await getProductById(tenant.id, id);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }
    return Response.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const body = await request.json();
    await updateProduct(tenant.id, id, body);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating product:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    await deleteProduct(tenant.id, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
