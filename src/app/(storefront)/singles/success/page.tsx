import { getTenant } from '@/lib/tenant-server'
import { prisma } from '@/lib/prisma'
import { CheckCircle2, Package, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const tenant = await getTenant();

  if (!tenant) {
    return (
      <div className="p-8 text-center pt-24 bg-muted/20 min-h-screen">
        <h1 className="text-2xl font-bold">Loja não encontrada</h1>
      </div>
    )
  }

  const tenantId = tenant.id;

  const { orderId } = await searchParams

  if (!orderId) {
    return (
      <div className="p-8 text-center pt-24 bg-muted/20 min-h-screen">
        <h1 className="text-2xl font-bold">Pedido não identificado</h1>
        <Link href="/singles" className="text-primary hover:underline mt-4 inline-block">Voltar para a loja</Link>
      </div>
    )
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      tenantId
    },
    include: {
      customer: true,
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

  if (!order) {
    return (
      <div className="p-8 text-center pt-24 bg-muted/20 min-h-screen">
        <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
        <Link href="/singles" className="text-primary hover:underline mt-4 inline-block">Voltar para a loja</Link>
      </div>
    )
  }


  return (
    <main className="flex-1 bg-muted/20 min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center max-w-2xl">
        <div className="bg-white p-8 rounded-2xl shadow-xl border w-full text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Agradecemos a sua compra na loja <span className="font-semibold">{tenant?.name || 'TCG Shop'}</span>. Seu pedido foi reservado com sucesso no nosso estoque.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cód. Pedido</p>
                <p className="font-mono text-sm font-semibold">{order.friendlyId || order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-sm font-semibold">{order.customer.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> Resumo dos Itens
              </h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="truncate">{item.inventoryItem?.cardTemplate?.name || 'Item não disponível'}</span>
                  </div>
                  <span className="font-semibold text-gray-600">
                    {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold">Total do Pedido</span>
              <span className="font-black text-2xl text-primary">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/singles"
              className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Continuar Comprando
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
