"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const StatusT: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  SHIPPED: "Enviado",
  CANCELLED: "Cancelado",
};

const StatusColor: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  PAID: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  SHIPPED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default async function AdminDashboardPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Autenticação Necessária
        </h1>
        <p className="text-muted-foreground">
          Você precisa estar em um subdomínio válido para acessar o painel.
        </p>
      </div>
    );
  }

  const [inventoryCount, inventoryAgg, ordersCount, revenueAgg, recentOrders] =
    await Promise.all([
      prisma.inventoryItem.count({ where: { tenantId } }),
      prisma.inventoryItem.aggregate({
        where: { tenantId },
        _sum: { price: true },
      }),
      prisma.order.count({ where: { tenantId } }),
      prisma.order.aggregate({
        where: { tenantId, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            include: {
              inventoryItem: { include: { cardTemplate: true } },
            },
          },
        },
      }),
    ]);

  const totalInventoryValue = Number(inventoryAgg._sum.price ?? 0);
  const totalRevenue = Number(revenueAgg._sum.totalAmount ?? 0);

  const kpis = [
    {
      title: "Cartas em Estoque",
      value: inventoryCount.toLocaleString("pt-BR"),
      icon: Package,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      title: "Valor do Estoque",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalInventoryValue),
      icon: TrendingUp,
      color:
        "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      title: "Vendas Realizadas",
      value: ordersCount.toLocaleString("pt-BR"),
      icon: ShoppingCart,
      color:
        "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      title: "Receita Total",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalRevenue),
      icon: DollarSign,
      color:
        "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="space-y-0.5">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Acompanhe as métricas principais da sua loja em tempo real
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.title}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-card to-card/50 p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 backdrop-blur-sm"
            style={{
              animation: `fadeInUp 0.5s ease-out ${idx * 0.1}s both`,
            }}
          >
            {/* Background gradient accent */}
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex items-start gap-4">
              <div
                className={`p-3 rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 ${kpi.color}`}
              >
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {kpi.title}
                </p>
                <p className="text-3xl font-black tracking-tight leading-none tabular-nums text-foreground">
                  {kpi.value}
                </p>
                <p className="text-xs text-muted-foreground mt-2.5">Hoje</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Últimas Vendas
            </h2>
            <p className="text-sm text-muted-foreground">
              Pedidos recentes e suas informações
            </p>
          </div>
          <Link href="/admin/orders">
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Ver Tudo
            </Button>
          </Link>
        </div>

        <div className="overflow-hidden rounded-lg bg-card/40 shadow-sm">
          {recentOrders.length === 0 ? (
            <div className="text-center py-20 px-4 text-muted-foreground">
              <div className="mb-4 flex justify-center">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground/40" />
                </div>
              </div>
              <p className="text-sm font-medium">
                Nenhuma venda registrada ainda.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Quando seus clientes fizerem pedidos, eles aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <div
                    className={`flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-200 cursor-pointer group`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="hidden sm:flex -space-x-1">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="h-10 w-7 rounded-md border-2 border-background bg-card shadow-sm overflow-hidden shrink-0 ring-1 ring-border/30"
                          >
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
                          <div className="h-10 w-7 rounded-md border-2 border-background bg-muted shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 ring-1 ring-border/30">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {order.customerName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "pt-BR",
                          )}{" "}
                          · {order.items.length}{" "}
                          {order.items.length === 1 ? "item" : "itens"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <Badge
                        className={`${StatusColor[order.status]} border-0 text-[11px] font-bold uppercase px-2.5 py-1`}
                      >
                        {StatusT[order.status]}
                      </Badge>
                      <span className="text-sm font-bold font-mono tabular-nums w-28 text-right text-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(Number(order.totalAmount))}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
