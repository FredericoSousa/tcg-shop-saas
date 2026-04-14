import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { container, TOKENS } from "@/lib/infrastructure/container";
import type { IUserRepository } from "@/lib/domain/repositories/user.repository";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ session, tenant }) => {
    try {
      const { id } = await params;

      // Prevent admin from deleting themselves
      if (session.userId === id) {
        return Response.json({ error: "Cannot delete yourself" }, { status: 400 });
      }

      const userRepo = container.resolve<IUserRepository>(TOKENS.UserRepository);
      const user = await userRepo.findById(id);
      if (!user) return Response.json({ error: "User not found" }, { status: 404 });

      await userRepo.delete(id);
      return Response.json({ success: true });
    } catch (error) {
      logger.error("Error deleting user", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
