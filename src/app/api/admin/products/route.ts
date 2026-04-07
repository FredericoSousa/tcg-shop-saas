import { validateAdminApi } from "@/lib/tenant-server";
import { getProductsPaginated, createProduct } from "@/lib/services/product.service";

export async function GET(request: Request) {
  const context = await validateAdminApi();
  
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  try {
    const data = await getProductsPaginated(tenant.id, page, limit, search, categoryId);
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
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
    const product = await createProduct(tenant.id, body);
    return Response.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
