import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { validateAdminApi } from "@/lib/tenant-server";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

/**
 * @openapi
 * /api/orders/status:
 *   patch:
 *     summary: Update order status
 *     description: Updates the status of one or more orders. If status is CANCELLED, restores inventory. Requires admin authentication.
 *     tags: [Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               orderId: { type: string }
 *               orderIds: { type: array, items: { type: string } }
 *               status: 
 *                 type: string
 *                 enum: [PENDING, PAID, SHIPPED, CANCELLED]
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Missing orderId/orderIds or status
 */
export async function PATCH(request: NextRequest) {
  const context = await validateAdminApi();

  if (!context) {
    return ApiResponse.unauthorized("Ação não autorizada. Escopo restrito do Lojista.");
  }

  const { tenant } = context;

  try {
    const { orderId, orderIds, status } = (await request.json()) as {
      orderId?: string;
      orderIds?: string[];
      status: OrderStatus;
    };

    if ((!orderId && !orderIds) || !status) {
      return ApiResponse.badRequest("orderId/orderIds e status são obrigatórios");
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
    
    return ApiResponse.success({ message: "Status do pedido atualizado com sucesso" });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[Orders API]", error.message);
    return ApiResponse.serverError("Falha ao processar atualização de status do pedido.");
  }
}
