import { validateAdminApi } from "@/lib/tenant-server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session, tenant } = context;
  const { id } = await params;

  // Prevent admin from deleting themselves
  if (session.userId === id) {
    return Response.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: tenant.id,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
