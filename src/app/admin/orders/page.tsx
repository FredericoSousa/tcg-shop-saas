import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { OrdersClient } from './orders-client'

export default async function OrdersPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-destructive">Dashboard de Vendas</h1>
        <p className="border p-4 rounded-md">
          Falha de autorização. Esta página requer identificação de Lojista.
        </p>
      </div>
    )
  }

  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          inventoryItem: {
            include: {
              cardTemplate: true
            }
          }
        }
      }
    }
  })

  // Format Decimal fields strictly for JSON Client Boundary transmission
  const formattedOrders = orders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    items: order.items.map(item => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
      inventoryItem: {
        ...item.inventoryItem,
        price: Number(item.inventoryItem.price)
      }
    }))
  }))

  return (
    <main className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Registro de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Gira os status e confira os detalhes das compras realizadas na sua loja.
          </p>
        </div>
      </div>
      
      <OrdersClient orders={formattedOrders} />
    </main>
  )
}
