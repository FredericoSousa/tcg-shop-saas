'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { Package, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const StatusT: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  CANCELLED: 'Cancelado',
}

const StatusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SHIPPED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

export default async function AdminDashboardPage() {
  const headersList = await headers()
  const tenantId = headersList.get('x-tenant-id')

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Autenticação Necessária</h1>
        <p className="text-muted-foreground">Você precisa estar em um subdomínio válido para acessar o painel.</p>
      </div>
    )
  }

  const [inventoryCount, inventoryAgg, ordersCount, revenueAgg, recentOrders] = await Promise.all([
    prisma.inventoryItem.count({ where: { tenantId } }),
    prisma.inventoryItem.aggregate({
      where: { tenantId },
      _sum: { price: true },
    }),
    prisma.order.count({ where: { tenantId } }),
    prisma.order.aggregate({
      where: { tenantId, status: { not: 'CANCELLED' } },
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        items: {
          include: {
            inventoryItem: { include: { cardTemplate: true } },
          },
        },
      },
    }),
  ])

  const totalInventoryValue = Number(inventoryAgg._sum.price ?? 0)
  const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0)

  const kpis = [
    {
      title: 'Cartas em Estoque',
      value: inventoryCount.toLocaleString('pt-BR'),
      icon: Package,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      title: 'Valor do Estoque',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInventoryValue),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      title: 'Vendas Realizadas',
      value: ordersCount.toLocaleString('pt-BR'),
      icon: ShoppingCart,
      color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400',
    },
    {
      title: 'Receita Total',
      value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue),
      icon: DollarSign,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Visão geral da sua loja.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="relative bg-card rounded-xl border shadow-sm p-5 flex items-start gap-4 overflow-hidden transition-colors hover:border-primary/30"
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${kpi.color}`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{kpi.title}</p>
              <p className="text-2xl font-black tracking-tight leading-none tabular-nums">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold tracking-tight">Últimas Vendas</h2>
          <Link href="/admin/orders">
            <Button variant="outline" size="sm">Ver Todas</Button>
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Nenhuma venda registrada ainda.</p>
          </div>
        ) : (
          <div className="divide-y">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="hidden sm:flex -space-x-2">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="h-9 w-7 rounded border bg-card shadow-sm overflow-hidden shrink-0">
                        {item.inventoryItem.cardTemplate?.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.inventoryItem.cardTemplate.imageUrl}
                            className="h-full w-full object-cover"
                            alt=""
                          />
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="h-9 w-7 rounded border bg-muted shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{order.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')} · {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={`${StatusColor[order.status]} border-0 text-[10px] font-bold uppercase`}>
                    {StatusT[order.status]}
                  </Badge>
                  <span className="text-sm font-bold font-mono tabular-nums w-24 text-right">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(order.totalAmount))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
