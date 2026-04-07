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
    const { orderId, status } = (await request.json()) as {
      orderId: string;
      status: OrderStatus;
    };

    if (!orderId || !status) {
      return Response.json(
        { success: false, error: "orderId e status são obrigatórios" },
        { status: 400 },
      );
    }

    // If cancelling, restore inventory quantities in a transaction
    if (status === "CANCELLED") {
      const order = await prisma.order.findUnique({
        where: { id: orderId, tenantId: tenant.id },
        include: { items: true },
      });

      if (!order) {
        return Response.json(
          { success: false, error: "Pedido não encontrado." },
          { status: 404 },
        );
      }

      if (order.status === "CANCELLED") {
        return Response.json(
          { success: false, error: "Pedido já está cancelado." },
          { status: 400 },
        );
      }

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
          where: { id: orderId, tenantId: tenant.id },
          data: { status },
        });
      });
    } else {
      await prisma.order.update({
        where: { id: orderId, tenantId: tenant.id },
        data: { status },
      });
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
