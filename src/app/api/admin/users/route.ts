import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListUsersUseCase, SaveUserUseCase } from "@/lib/application/use-cases/settings-users.use-case";
import { logger } from "@/lib/logger";

const listUsersUseCase = container.resolve(ListUsersUseCase);
const saveUserUseCase = container.resolve(SaveUserUseCase);

export async function GET() {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const users = await listUsersUseCase.execute(tenant.id);
    return Response.json(users);
  } catch (error) {
    logger.error("Error fetching users", error as Error, { tenantId: tenant.id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const context = await validateAdminApi();
  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { tenant } = context;

  try {
    const { username, password, role } = await request.json();
    const user = await saveUserUseCase.execute({ username, password, role, tenantId: tenant.id });
    return Response.json(user);
  } catch (error) {
    logger.error("Error in save user API", error as Error, { tenantId: tenant.id });
    return Response.json({ error: (error as Error).message || "Internal server error" }, { status: 400 });
  }
}
