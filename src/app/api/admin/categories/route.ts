import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListCategoriesUseCase } from "@/lib/application/use-cases/list-categories.use-case";
import { SaveCategoryUseCase } from "@/lib/application/use-cases/save-category.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/admin/categories:
 *   get:
 *     summary: List categories
 *     description: Returns all product categories for the tenant. Requires admin authentication.
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *   post:
 *     summary: Create or update category
 *     description: Creates a new category or updates an existing one. Requires admin authentication.
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               id: { type: string }
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Category saved
 */
export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      const listCategoriesUseCase = container.resolve(ListCategoriesUseCase);
      const categories = await listCategoriesUseCase.execute();
      return ApiResponse.success(categories);
    } catch (error) {
      logger.error("Error fetching categories", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const body = await request.json();
      const saveCategoryUseCase = container.resolve(SaveCategoryUseCase);
      const category = await saveCategoryUseCase.execute({ ...body });
      return ApiResponse.success(category);
    } catch (error) {
      logger.error("Error creating category", error as Error, { tenantId: tenant.id });
      return ApiResponse.serverError();
    }
  });
}
