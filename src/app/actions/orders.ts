'use server'

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import { OrderStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return { success: false, error: 'Ação não autorizada. Escopo restrito do Lojista.' }
  }

  try {
    // If cancelling, restore inventory quantities in a transaction
    if (status === 'CANCELLED') {
      const order = await prisma.order.findUnique({
        where: { id: orderId, tenantId },
        include: { items: true },
      })

      if (!order) {
        return { success: false, error: 'Pedido não encontrado.' }
      }

      if (order.status === 'CANCELLED') {
        return { success: false, error: 'Pedido já está cancelado.' }
      }

      await prisma.$transaction([
        // Restore each item's quantity to inventory
        ...order.items.map((item) =>
          prisma.inventoryItem.update({
            where: { id: item.inventoryItemId },
            data: { quantity: { increment: item.quantity } },
          })
        ),
        // Update order status
        prisma.order.update({
          where: { id: orderId, tenantId },
          data: { status },
        }),
      ])
    } else {
      await prisma.order.update({
        where: { id: orderId, tenantId },
        data: { status },
      })
    }

    revalidatePath('/admin/orders')
    revalidatePath('/admin/inventory')
    return { success: true }
  } catch (err: unknown) {
    const error = err as Error
    console.error('[Orders API]', error.message)
    return { success: false, error: 'Falha ao processar atualização de status do pedido.' }
  }
}
