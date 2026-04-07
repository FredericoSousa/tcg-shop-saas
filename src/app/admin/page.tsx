import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminContext } from "@/lib/tenant-server";

export default async function AdminDashboardPage() {
  const { tenant } = await getAdminContext();

  const [inventoryCount, inventoryAgg, ordersCount, revenueAgg, recentOrders] =
    await Promise.all([
      prisma.inventoryItem.count({ where: { tenantId: tenant.id } }),
      prisma.inventoryItem.aggregate({
        where: { tenantId: tenant.id },
        _sum: { price: true },
      }),
      prisma.order.count({ where: { tenantId: tenant.id } }),
      prisma.order.aggregate({
        where: { tenantId: tenant.id, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: true,
          items: {
            include: {
              inventoryItem: { include: { cardTemplate: true } },
              product: true,
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
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Dashboard"
        description="Acompanhe as métricas principais da sua loja em tempo real"
        icon={LayoutDashboard}
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.title}
            className="group relative overflow-hidden rounded-xl bg-card/40 border shadow-sm backdrop-blur-sm bg-gradient-to-br from-card to-card/50 p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Últimas Vendas
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Pedidos recentes e suas informações
            </p>
          </div>
          <Link href="/admin/orders">
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-300 hover:bg-muted/80 hover:shadow-sm h-9 px-4"
            >
              Ver Tudo
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
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
                        {order.items.slice(0, 3).map((item) => {
                          const imageUrl = item.inventoryItem?.cardTemplate?.imageUrl || item.product?.imageUrl;
                          return (
                            <div
                              key={item.id}
                              className="h-10 w-7 rounded-md border-2 border-background bg-card shadow-sm overflow-hidden shrink-0 ring-1 ring-border/30"
                            >
                              {imageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
                                  className="h-full w-full object-cover"
                                  alt=""
                                />
                              )}
                            </div>
                          );
                        })}
                        {order.items.length > 3 && (
                          <div className="h-10 w-7 rounded-md border-2 border-background bg-muted shadow-sm flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 ring-1 ring-border/30">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {order.customer.name}
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
                      <StatusBadge status={order.status} />
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
