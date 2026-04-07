import { NextRequest } from "next/server";
import { validateAdminApi } from "@/lib/tenant-server";
import { container, TOKENS } from "@/lib/infrastructure/container";
import type { IUserRepository } from "@/lib/domain/repositories/tenant.repository";
import { logger } from "@/lib/logger";

const userRepo = container.resolve<IUserRepository>(TOKENS.UserRepository);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();

  if (!context) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { session, tenant } = context;
  const { id } = await params;

  // Prevent admin from deleting themselves
  if (session.userId === id) {
    return Response.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    const user = await userRepo.findById(id, tenant.id);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    await userRepo.delete(id, tenant.id);
    return Response.json({ success: true });
  } catch (error) {
    logger.error("Error deleting user", error as Error, { tenantId: tenant.id, userId: id });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
