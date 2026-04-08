import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListCustomersUseCase } from "@/lib/application/use-cases/list-customers.use-case";
import { CreateCustomerUseCase } from "@/lib/application/use-cases/create-customer.use-case";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const search = searchParams.get("search") || undefined;
      const includeDeleted = searchParams.get("includeDeleted") === "true";

      const listCustomersUseCase = container.resolve(ListCustomersUseCase);
      const result = await listCustomersUseCase.execute({ page, limit, search, includeDeleted });
      return Response.json(result);
    } catch (error) {
      logger.error("Error fetching customers", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { name, email, phoneNumber } = await request.json();

      if (!name || !phoneNumber) {
        return Response.json({ error: "Nome e Telefone são obrigatórios" }, { status: 400 });
      }

      const createCustomerUseCase = container.resolve(CreateCustomerUseCase);
      const customer = await createCustomerUseCase.execute({ name, email, phoneNumber });
      return Response.json(customer);
    } catch (error) {
      logger.error("Error creating customer", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
