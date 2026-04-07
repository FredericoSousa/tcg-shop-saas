import { validateAdminApi } from "@/lib/tenant-server";
import { updateCategory, deleteCategory } from "@/lib/services/product.service";

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
    await updateCategory(tenant.id, id, body);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating category:", error);
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
    await deleteCategory(tenant.id, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
