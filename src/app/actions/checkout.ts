'use server'

import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export type CheckoutItem = {
  inventoryId: string
  quantity: number
  price: number
}

export type CustomerData = {
  name: string
  email?: string
}

export async function processCheckout(
  items: CheckoutItem[],
  customerData: CustomerData
) {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return { success: false, error: 'Tenant ID não identificado' }
  }

  if (!items || items.length === 0) {
    return { success: false, error: 'O carrinho está vazio' }
  }

  try {
    // 2. Iniciar uma prisma.$transaction
    const order = await prisma.$transaction(async (tx) => {
      // 3. Optimistic Update por item
      for (const item of items) {
        const updateResult = await tx.inventoryItem.updateMany({
          where: {
            id: item.inventoryId,
            tenantId, // Garante que a loja correta está sendo alterada
            quantity: {
              gte: item.quantity, // Impede vendas abaixo de zero
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })

        // 4. Se count === 0, força rollback subindo o Erro
        if (updateResult.count === 0) {
          throw new Error('Item esgotado ou quantidade insuficiente no estoque.')
        }
      }

      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

      // 5. Criar registro de Order e OrderItems
      const newOrder = await tx.order.create({
        data: {
          tenantId,
          customerName: customerData.name,
          customerEmail: customerData.email,
          totalAmount,
          items: {
            create: items.map((item) => ({
              inventoryItemId: item.inventoryId,
              quantity: item.quantity,
              priceAtPurchase: item.price,
            })),
          },
        },
      })

      return newOrder
    })

    // 6. Retornar ID pro Front
    return { success: true, orderId: order.id }
  } catch (error: unknown) {
    const err = error as Error
    console.error('[Checkout Error]', err.message)
    return { success: false, error: err.message || 'Erro catastrófico no processamento do checkout.' }
  }
}
