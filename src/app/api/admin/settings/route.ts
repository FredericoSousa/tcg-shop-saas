import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await getSession();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!session || session.role !== "ADMIN" || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        active: true,
        logoUrl: true,
        faviconUrl: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        instagram: true,
        whatsapp: true,
        facebook: true,
        twitter: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error fetching tenant settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!session || session.role !== "ADMIN" || session.tenantId !== tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const updateData: any = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: updateData,
    });

    return NextResponse.json(tenant);
  } catch (error) {
    console.error("Error updating tenant settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
