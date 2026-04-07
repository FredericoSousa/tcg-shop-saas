import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function PATCH(request: NextRequest) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: "Ação não autorizada. Escopo restrito do Lojista." },
      { status: 401 },
    );
  }

  try {
    const { orderId, status } = (await request.json()) as {
      orderId: string;
      status: OrderStatus;
    };

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: "orderId e status são obrigatórios" },
        { status: 400 },
      );
    }

    // If cancelling, restore inventory quantities in a transaction
    if (status === "CANCELLED") {
      const order = await prisma.order.findUnique({
        where: { id: orderId, tenantId },
        include: { items: true },
      });

      if (!order) {
        return NextResponse.json(
          { success: false, error: "Pedido não encontrado." },
          { status: 404 },
        );
      }

      if (order.status === "CANCELLED") {
        return NextResponse.json(
          { success: false, error: "Pedido já está cancelado." },
          { status: 400 },
        );
      }

      await prisma.$transaction([
        // Restore each item's quantity to inventory
        ...order.items.map((item) =>
          prisma.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { quantity: { increment: item.quantity } },
          }),
        ),
        // Update order status
        prisma.order.update({
          where: { id: orderId, tenantId },
          data: { status },
        }),
      ]);
    } else {
      await prisma.order.update({
        where: { id: orderId, tenantId },
        data: { status },
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/singles");
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Orders API]", error.message);
    return NextResponse.json(
      { success: false, error: "Falha ao processar atualização de status do pedido." },
      { status: 500 },
    );
  }
}
