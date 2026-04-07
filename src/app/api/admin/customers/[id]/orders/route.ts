import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import { getCustomerOrdersPaginated } from "@/lib/services/customer.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const { id } = await params;

  if (!session || session.role !== "ADMIN" || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await getCustomerOrdersPaginated(tenantId, id, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
