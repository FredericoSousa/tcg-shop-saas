import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";
import {
  updateCustomer,
  softDeleteCustomer,
  restoreCustomer,
  getCustomerWithOrders,
} from "@/lib/services/customer.service";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
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
    const customer = await getCustomerWithOrders(tenantId, id);
    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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
    const { name, email, phoneNumber } = await request.json();

    const customer = await updateCustomer(tenantId, id, { name, email, phoneNumber });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
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
    await softDeleteCustomer(tenantId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: { id: string } }
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
    // Treat PATCH as restore for now, or could handle partial updates
    await restoreCustomer(tenantId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error restoring customer:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
