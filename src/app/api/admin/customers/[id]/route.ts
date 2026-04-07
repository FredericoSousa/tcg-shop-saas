import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { PrismaCustomerRepository } from "@/lib/infrastructure/repositories/prisma-customer.repository";
import { GetCustomerUseCase } from "@/lib/application/use-cases/get-customer.use-case";
import { UpdateCustomerUseCase } from "@/lib/application/use-cases/update-customer.use-case";
import { logger } from "@/lib/logger";

const customerRepo = new PrismaCustomerRepository();
const getCustomerUseCase = new GetCustomerUseCase(customerRepo);
const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const result = await getCustomerUseCase.execute(id, tenant.id);
    if (!result) return Response.json({ error: "Customer not found" }, { status: 404 });
    
    // Maintain backward compatibility with the expected shape if necessary, 
    // though Clean Arch suggests returning the entity + stats.
    return Response.json({ ...result.customer, stats: result.stats });
  } catch (error) {
    logger.error("Error fetching customer details", error as Error, { tenantId: tenant.id, customerId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { name, email, phoneNumber } = await request.json();
    const customer = await updateCustomerUseCase.execute({ id, tenantId: tenant.id, name, email, phoneNumber });
    return Response.json(customer);
  } catch (error) {
    logger.error("Error updating customer", error as Error, { tenantId: tenant.id, customerId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    await updateCustomerUseCase.execute({ id, tenantId: tenant.id, deletedAt: new Date() });
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error deleting customer", error as Error, { tenantId: tenant.id, customerId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();
  const { id } = await params;

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    await updateCustomerUseCase.execute({ id, tenantId: tenant.id, deletedAt: null });
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error restoring customer", error as Error, { tenantId: tenant.id, customerId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
