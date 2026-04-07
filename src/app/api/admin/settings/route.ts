import { validateAdminApi } from "@/lib/tenant-server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    return Response.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant settings:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tenant } = context;

  try {
    const data = await request.json();

    // Basic validation
    const allowedFields = [
      "name",
      "logoUrl",
      "faviconUrl",
      "description",
      "address",
      "phone",
      "email",
      "instagram",
      "whatsapp",
      "facebook",
      "twitter",
    ];

    const updateData: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: tenant.id },
      data: updateData,
    });

    return Response.json(updatedTenant);
  } catch (error) {
    console.error("Error updating tenant settings:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
