import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getCustomersPaginated,
  createCustomer,
} from "@/lib/services/customer.service";

export async function GET(request: Request) {
  const session = await getSession();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

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
    const search = searchParams.get("search") || undefined;
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = await getCustomersPaginated(tenantId, page, limit, search, includeDeleted);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!session || session.role !== "ADMIN" || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID is required" }, { status: 400 });
  }

  try {
    const { name, email, phoneNumber } = await request.json();

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: "Nome e Telefone são obrigatórios" }, { status: 400 });
    }

    const customer = await createCustomer(tenantId, { name, email, phoneNumber });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
