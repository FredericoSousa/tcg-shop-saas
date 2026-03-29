import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { OrdersClient } from './orders-client'
import { ShoppingCart } from 'lucide-react'

export default async function OrdersPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Falha de Autorização</h1>
        <p className="text-muted-foreground">Esta página requer identificação de Lojista vinculada ao subdomínio ou sessão ativa.</p>
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
    <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg shrink-0">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Registro de Vendas</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Acompanhe e gerencie as compras realizadas na sua loja.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
        <OrdersClient orders={formattedOrders} />
      </div>
    </div>
  )
}
