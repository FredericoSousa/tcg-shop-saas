import { validateAdminApi } from "@/lib/tenant-server";
import { getProductsPaginated } from "@/lib/services/product.service";

export async function GET(request: Request) {
  const context = await validateAdminApi();
  
  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || "";
  
  // We'll use a larger limit for POS search to show more results at once
  const limit = 20;
  const page = 1;

  try {
    const data = await getProductsPaginated(tenant.id, page, limit, search);
    return Response.json(data.items);
  } catch (error) {
    console.error("Error in POS search API:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
