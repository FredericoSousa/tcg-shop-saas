import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListCustomersUseCase } from "@/lib/application/use-cases/list-customers.use-case";
import { CreateCustomerUseCase } from "@/lib/application/use-cases/create-customer.use-case";
import { logger } from "@/lib/logger";

const listCustomersUseCase = container.resolve(ListCustomersUseCase);
const createCustomerUseCase = container.resolve(CreateCustomerUseCase);

export async function GET(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = await listCustomersUseCase.execute({ tenantId: tenant.id, page, limit, search, includeDeleted });
    return Response.json(result);
  } catch (error) {
    logger.error("Error fetching customers", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { name, email, phoneNumber } = await request.json();

    if (!name || !phoneNumber) {
      return Response.json({ error: "Nome e Telefone são obrigatórios" }, { status: 400 });
    }

    const customer = await createCustomerUseCase.execute({ tenantId: tenant.id, name, email, phoneNumber });
    return Response.json(customer);
  } catch (error) {
    logger.error("Error creating customer", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
