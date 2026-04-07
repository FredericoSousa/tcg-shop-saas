import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCategories, createCategory } from "@/lib/services/product.service";

export async function GET() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 401 });
  }

  try {
    const categories = await getCategories(tenantId);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
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
    const category = await createCategory(tenantId, body);
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
