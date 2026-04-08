import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { validateAdminApi } from "@/lib/tenant-server";

export async function PATCH(request: Request) {
  const context = await validateAdminApi();

  if (!context) {
    return Response.json(
      { success: false, error: "Ação não autorizada. Escopo restrito do Lojista." },
      { status: 401 },
    );
  }

  const { tenant } = context;

  try {
    const { orderId, orderIds, status } = (await request.json()) as {
      orderId?: string;
      orderIds?: string[];
      status: OrderStatus;
    };

    if ((!orderId && !orderIds) || !status) {
      return Response.json(
        { success: false, error: "orderId/orderIds e status são obrigatórios" },
        { status: 400 },
      );
    }

    const ids = orderIds || [orderId!];

    // Process each order
    for (const id of ids) {
      // If cancelling, restore inventory quantities in a transaction
      if (status === "CANCELLED") {
        const order = await prisma.order.findUnique({
          where: { id },
          include: { items: true },
        });

        if (!order || order.status === "CANCELLED") continue;

        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            if (item.inventoryItemId) {
              await tx.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: { quantity: { increment: item.quantity } },
              });
            } else if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
          await tx.order.update({
            where: { id },
            data: { status },
          });
        });
      } else {
        await prisma.order.update({
          where: { id },
          data: { status },
        });
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/singles");
    revalidatePath("/");
    return Response.json({ success: true });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Orders API]", error.message);
    return Response.json(
      { success: false, error: "Falha ao processar atualização de status do pedido." },
      { status: 500 },
    );
  }
}
