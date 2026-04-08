import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListCategoriesUseCase } from "@/lib/application/use-cases/list-categories.use-case";
import { SaveCategoryUseCase } from "@/lib/application/use-cases/save-category.use-case";
import { logger } from "@/lib/logger";

export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      const listCategoriesUseCase = container.resolve(ListCategoriesUseCase);
      const categories = await listCategoriesUseCase.execute();
      return Response.json(categories);
    } catch (error) {
      logger.error("Error fetching categories", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const body = await request.json();
      const saveCategoryUseCase = container.resolve(SaveCategoryUseCase);
      const category = await saveCategoryUseCase.execute({ ...body });
      return Response.json(category);
    } catch (error) {
      logger.error("Error creating category", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
