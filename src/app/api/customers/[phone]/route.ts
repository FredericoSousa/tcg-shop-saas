import { NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { runWithTenant } from "@/lib/tenant-context";
import { LookupCustomerUseCase } from "@/lib/application/use-cases/lookup-customer.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

const lookupCustomerUseCase = container.resolve(LookupCustomerUseCase);

/**
 * @openapi
 * /api/customers/{phone}:
 *   get:
 *     summary: Look up customer by phone
 *     description: Checks if a customer exists with the given phone number.
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: phone
 *         schema: { type: string }
 *         required: true
 *         description: Customer phone number
 *     responses:
 *       200:
 *         description: Customer lookup result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const tenant = await getTenant();

  if (!tenant) {
    return ApiResponse.unauthorized("Tenant ID não identificado");
  }

  const { phone } = await params;

  try {
    const customer = await runWithTenant(tenant.id, () => 
      lookupCustomerUseCase.execute(phone)
    );

    return ApiResponse.success({
      exists: !!customer,
      id: customer?.id,
    });
  } catch (error) {
    logger.error("Customer Lookup Error", error as Error, { tenantId: tenant.id, phone });
    return ApiResponse.serverError("Erro ao buscar cliente");
  }
}
