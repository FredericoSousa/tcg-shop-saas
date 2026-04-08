import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListUsersUseCase, SaveUserUseCase } from "@/lib/application/use-cases/settings-users.use-case";
import { logger } from "@/lib/logger";

export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      const listUsersUseCase = container.resolve(ListUsersUseCase);
      const users = await listUsersUseCase.execute();
      return Response.json(users);
    } catch (error) {
      logger.error("Error fetching users", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { username, password, role } = await request.json();
      const saveUserUseCase = container.resolve(SaveUserUseCase);
      const user = await saveUserUseCase.execute({ username, password, role });
      return Response.json(user);
    } catch (error) {
      logger.error("Error in save user API", error as Error, { tenantId: tenant.id });
      return Response.json({ error: (error as Error).message || "Internal server error" }, { status: 400 });
    }
  });
}
