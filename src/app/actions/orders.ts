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
    const updated = await prisma.order.update({
      where: {
        id: orderId,
        tenantId, // Garantia de segurança (O tenant só mexe na própria ordem)
      },
      data: {
        status,
      }
    })
    
    revalidatePath('/admin/orders')
    return { success: true, order: updated }
  } catch (err: unknown) {
    const error = err as Error
    console.error('[Orders API]', error.message)
    return { success: false, error: 'Falha ao processar atualização de status do pedido.' }
  }
}
