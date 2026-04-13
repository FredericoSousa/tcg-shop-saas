import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { SaveProductUseCase } from "@/lib/application/use-cases/save-product.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

const listProductsUseCase = container.resolve(ListProductsUseCase);
const saveProductUseCase = container.resolve(SaveProductUseCase);

/**
 * @openapi
 * /api/admin/products:
 *   get:
 *     summary: List products
 *     description: Returns a paginated list of products. Requires admin authentication.
 *     tags: [Products]
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
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of products
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   post:
 *     summary: Create or update product
 *     description: Creates a new product or updates an existing one. Requires admin authentication.
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               id: { type: string }
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number }
 *               stock: { type: number }
 *               categoryId: { type: string }
 *               imageUrl: { type: string }
 *     responses:
 *       200:
 *         description: Product saved
 */
export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const searchParams = request.nextUrl.searchParams;
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 10;
      const search = searchParams.get("search") || undefined;
      const categoryId = searchParams.get("categoryId") || undefined;

      const result = await listProductsUseCase.execute({ page, limit, search, categoryId });
      return ApiResponse.success(result);
    } catch (error) {
      logger.error("Error fetching products", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const body = await request.json();
      const product = await saveProductUseCase.execute({ ...body });
      return ApiResponse.success(product);
    } catch (error) {
      logger.error("Error creating product", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
