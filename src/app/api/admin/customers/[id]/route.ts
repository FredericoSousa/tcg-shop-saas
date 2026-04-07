import { validateAdminApi } from "@/lib/tenant-server";
import {
  updateCustomer,
  softDeleteCustomer,
  restoreCustomer,
  getCustomerWithOrders,
} from "@/lib/services/customer.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const customer = await getCustomerWithOrders(tenant.id, id);
    if (!customer) {
      return Response.json({ error: "Customer not found" }, { status: 404 });
    }
    return Response.json(customer);
  } catch (error) {
    console.error("Error fetching customer details:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
    const { name, email, phoneNumber } = await request.json();

    const customer = await updateCustomer(tenant.id, id, { name, email, phoneNumber });
    return Response.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    await softDeleteCustomer(tenant.id, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    // Treat PATCH as restore for now, or could handle partial updates
    await restoreCustomer(tenant.id, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error restoring customer:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
