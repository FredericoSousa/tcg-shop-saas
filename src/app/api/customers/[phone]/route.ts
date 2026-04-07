import { NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { PrismaCustomerRepository } from "@/lib/infrastructure/repositories/prisma-customer.repository";
import { LookupCustomerUseCase } from "@/lib/application/use-cases/lookup-customer.use-case";
import { logger } from "@/lib/logger";

const customerRepo = new PrismaCustomerRepository();
const lookupCustomerUseCase = new LookupCustomerUseCase(customerRepo);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const tenant = await getTenant();

  if (!tenant) {
    return Response.json(
      { success: false, error: "Tenant ID não identificado" },
      { status: 401 }
    );
  }

  const { phone } = await params;

  try {
    const customer = await lookupCustomerUseCase.execute(phone, tenant.id);

    if (customer) {
      return Response.json({ exists: true, id: customer.id });
    }

    return Response.json({ exists: false });
  } catch (error) {
    logger.error("Customer Lookup Error", error as Error, { tenantId: tenant.id, phone });
    return Response.json(
      { success: false, error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}
