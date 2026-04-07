import { validateAdminApi } from "@/lib/tenant-server";
import { getCategories, createCategory } from "@/lib/services/product.service";

export async function GET() {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const categories = await getCategories(tenant.id);
    return Response.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const body = await request.json();
    const category = await createCategory(tenant.id, body);
    return Response.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
