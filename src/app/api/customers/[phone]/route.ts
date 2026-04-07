import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
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
          tenantId,
        },
      },
      select: {
        id: true,
      },
    });

    if (customer) {
      return NextResponse.json({ exists: true });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error("[Customer Lookup Error]", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}
