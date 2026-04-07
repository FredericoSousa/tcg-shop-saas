import { getCustomerOrdersPaginated } from "@/lib/services/customer.service";
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await getCustomerOrdersPaginated(tenant.id, id, page, limit);
    return Response.json(result);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
