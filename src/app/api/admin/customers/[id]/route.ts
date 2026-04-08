import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { GetCustomerUseCase } from "@/lib/application/use-cases/get-customer.use-case";
import { UpdateCustomerUseCase } from "@/lib/application/use-cases/update-customer.use-case";
import { logger } from "@/lib/logger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const getCustomerUseCase = container.resolve(GetCustomerUseCase);
      
      const result = await getCustomerUseCase.execute(id);
      if (!result) return Response.json({ error: "Customer not found" }, { status: 404 });
      
      return Response.json({ ...result.customer, stats: result.stats });
    } catch (error) {
      logger.error("Error fetching customer details", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const updateCustomerUseCase = container.resolve(UpdateCustomerUseCase);
      
      const { name, email, phoneNumber } = await request.json();
      const customer = await updateCustomerUseCase.execute({ id, name, email, phoneNumber });
      return Response.json(customer);
    } catch (error) {
      logger.error("Error updating customer", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const updateCustomerUseCase = container.resolve(UpdateCustomerUseCase);
      
      await updateCustomerUseCase.execute({ id, deletedAt: new Date() });
      return Response.json({ success: true });
    } catch (error) {
      logger.error("Error deleting customer", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const updateCustomerUseCase = container.resolve(UpdateCustomerUseCase);
      
      await updateCustomerUseCase.execute({ id, deletedAt: null });
      return Response.json({ success: true });
    } catch (error) {
      logger.error("Error restoring customer", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
