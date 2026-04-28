import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { GetCustomerUseCase } from "@/lib/application/use-cases/customers/get-customer.use-case";
import { UpdateCustomerUseCase } from "@/lib/application/use-cases/customers/update-customer.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { id } = await params;
      const getCustomerUseCase = container.resolve(GetCustomerUseCase);
      
      const result = await getCustomerUseCase.execute(id);
      if (!result) return ApiResponse.notFound("Cliente não encontrado");
      
      return ApiResponse.success({ ...result.customer, stats: result.stats });
    } catch (error) {
      logger.error("Error fetching customer details", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
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
      return ApiResponse.success(customer);
    } catch (error) {
      logger.error("Error updating customer", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
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
      return ApiResponse.success({ success: true });
    } catch (error) {
      logger.error("Error deleting customer", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
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
      return ApiResponse.success({ success: true });
    } catch (error) {
      logger.error("Error restoring customer", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
