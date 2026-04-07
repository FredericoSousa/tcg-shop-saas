import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getProductsPaginated } from "@/lib/services/product.service";

export async function GET(request: Request) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q") || "";
  
  // We'll use a larger limit for POS search to show more results at once
  const limit = 20;
  const page = 1;

  try {
    const data = await getProductsPaginated(tenantId, page, limit, search);
    return NextResponse.json(data.items);
  } catch (error) {
    console.error("Error in POS search API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
