import { getTenant } from "@/lib/tenant-server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ phone: string }> }
) {
  const tenant = await getTenant();

  if (!tenant) {
    return Response.json(
      { success: false, error: "Tenant ID não identificado" },
      { status: 401 }
    );
  }

  const { phone } = await params;

  try {
    const customer = await prisma.customer.findUnique({
      where: {
        phoneNumber_tenantId: {
          phoneNumber: phone,
          tenantId: tenant.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (customer) {
      return Response.json({ exists: true });
    }

    return Response.json({ exists: false });
  } catch (error) {
    console.error("[Customer Lookup Error]", error);
    return Response.json(
      { success: false, error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}
