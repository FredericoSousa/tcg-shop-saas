import { NextRequest } from "next/server";
import { withTenantApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { LookupCustomerUseCase } from "@/lib/application/use-cases/lookup-customer.use-case";
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
  _request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;

  return withTenantApi(async () => {
    const customer = await lookupCustomerUseCase.execute(phone);

    return ApiResponse.success({
      exists: !!customer,
      id: customer?.id,
    });
  });
}
