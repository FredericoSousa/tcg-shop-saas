import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getProductsPaginated, createProduct } from "@/lib/services/product.service";

export async function GET(request: Request) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  try {
    const data = await getProductsPaginated(tenantId, page, limit, search, categoryId);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const product = await createProduct(tenantId, body);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
