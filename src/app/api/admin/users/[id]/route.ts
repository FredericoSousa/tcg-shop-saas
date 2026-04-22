import { NextRequest } from "next/server";
import { withAdminApi } from "@/lib/tenant-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminApi(async ({ session, tenant }) => {
    try {
      const { id } = await params;

      if (session.userId === id) {
        return Response.json({ error: "Cannot delete yourself" }, { status: 400 });
      }

      const { data: target, error: findErr } = await supabaseAdmin.auth.admin.getUserById(id);
      if (findErr || !target.user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }
      if (target.user.app_metadata?.tenantId !== tenant.id) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (deleteErr) throw deleteErr;

      return Response.json({ success: true });
    } catch (error) {
      logger.error("Error deleting user", error as Error, { tenantId: tenant.id });
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  });
}
