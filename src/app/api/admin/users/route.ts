import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListUsersUseCase } from "@/lib/application/use-cases/users/list-users.use-case";
import { SaveUserUseCase } from "@/lib/application/use-cases/users/save-user.use-case";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function GET(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { searchParams } = new URL(request.url);
      const page = Number(searchParams.get("page")) || 1;
      const limit = Number(searchParams.get("limit")) || 10;
      const search = searchParams.get("search") || undefined;

      const listUsersUseCase = container.resolve(ListUsersUseCase);
      const result = await listUsersUseCase.execute({ page, limit, search });
      return Response.json(result);
    } catch (error) {
      logger.error("Error fetching users", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { email, password, role } = await request.json();
      const saveUserUseCase = container.resolve(SaveUserUseCase);
      const user = await saveUserUseCase.execute({ email, password, role });
      return ApiResponse.success(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return ApiResponse.badRequest("Erro de validação", "VALIDATION_ERROR", error.flatten().fieldErrors);
      }
      logger.error("Error in save user API", error as Error, { tenantId: tenant.id });
      return ApiResponse.badRequest((error as Error).message || "Erro ao salvar usuário");
    }
  });
}
