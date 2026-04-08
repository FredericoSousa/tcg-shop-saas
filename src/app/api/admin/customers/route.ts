import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListCustomersUseCase } from "@/lib/application/use-cases/list-customers.use-case";
import { CreateCustomerUseCase } from "@/lib/application/use-cases/create-customer.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/customers:
 *   get:
 *     summary: List customers
 *     description: Returns a paginated list of customers. Requires admin authentication.
 *     tags: [Customers]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of customers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   post:
 *     summary: Create customer
 *     description: Creates a new customer. Requires admin authentication.
 *     tags: [Customers]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phoneNumber]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phoneNumber: { type: string }
 *     responses:
 *       201:
 *         description: Customer created
 */
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
      return ApiResponse.success(result);
    } catch (error) {
      logger.error("Error fetching customers", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { name, email, phoneNumber } = await request.json();

      if (!name || !phoneNumber) {
        return ApiResponse.badRequest("Nome e Telefone são obrigatórios");
      }

      const createCustomerUseCase = container.resolve(CreateCustomerUseCase);
      const customer = await createCustomerUseCase.execute({ name, email, phoneNumber });
      return ApiResponse.success(customer);
    } catch (error) {
      logger.error("Error creating customer", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
