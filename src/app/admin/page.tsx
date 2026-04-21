import "reflect-metadata";
import { Suspense } from "react";
import { container } from "@/lib/infrastructure/container";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, TrendingUp, Calendar, PieChart as PieChartIcon, LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminContext } from "@/lib/tenant-server";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { RevenueDashboard } from "@/components/admin/analytics/revenue-dashboard";
import { TopProductsTable } from "@/components/admin/analytics/top-products-table";
import { TopBuyersCard } from "@/components/admin/analytics/top-buyers-card";
import { GetDashboardSummaryUseCase } from "@/lib/application/use-cases/get-dashboard-summary.use-case";
import { ListOrdersUseCase } from "@/lib/application/use-cases/list-orders.use-case";
import { formatCurrency } from "@/lib/utils";


export default async function AdminDashboardPage() {
  const { tenant } = await getAdminContext();
  
  // Resolve use cases from container
  const getDashboardSummary = container.resolve(GetDashboardSummaryUseCase);
  const listOrders = container.resolve(ListOrdersUseCase);

  const [summary, ordersData] = await Promise.all([
    getDashboardSummary.execute(tenant.id),
    listOrders.execute({ 
      page: 1, 
      limit: 5, 
      filters: {} 
    })
  ]);

  const { inventoryCount, totalInventoryValue, ordersCount, totalRevenue, weeklyRevenue } = summary;
  const recentOrders = ordersData.items;

  const kpis: { title: string; value: string; icon: LucideIcon }[] = [
    {
      title: "Cartas em Estoque",
      value: inventoryCount.toLocaleString("pt-BR"),
      icon: Package,
    },
    {
      title: "Valor do Estoque",
      value: formatCurrency(totalInventoryValue),
      icon: TrendingUp,
    },
    {
      title: "Vendas Realizadas",
      value: ordersCount.toLocaleString("pt-BR"),
      icon: ShoppingCart,
    },
    {
      title: "Receita Total",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
    },
  ];

  return (
    <div className="flex flex-col gap-10 w-full animate-in fade-in duration-700">
      <PageHeader
        title="Painel de Controle"
        description="Monitoramento centralizado da sua operação TCG"
        icon={LayoutDashboard}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl">
              <Calendar className="h-4 w-4" />
              Últimos 30 dias
            </Button>
            <Button size="sm" className="gap-2 h-9 rounded-xl shadow-md">
              <TrendingUp className="h-4 w-4" />
              Relatório Completo
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="rounded-xl bg-card border border-border p-5 flex items-start justify-between gap-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {kpi.title}
              </p>
              <p className="text-2xl font-black tracking-tight leading-none tabular-nums text-foreground">
                {kpi.value}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-muted text-muted-foreground">
              <kpi.icon className="h-5 w-5" aria-hidden="true" />
            </div>
          </div>
        ))}
      </div>

      <Suspense fallback={<div className="h-96 rounded-2xl border bg-card/40 animate-pulse" />}>
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Inteligência de Vendas
              </h2>
              <p className="text-sm text-muted-foreground font-medium">
                Análise estratégica de faturamento e performance
              </p>
            </div>
          </div>
          <RevenueDashboard />
        </section>
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="h-64 rounded-2xl border bg-card/40 animate-pulse" />}>
            <TopProductsTable />
          </Suspense>
        </div>

        <div className="lg:col-span-1">
          <Suspense fallback={<div className="h-64 rounded-2xl border bg-card/40 animate-pulse" />}>
            <TopBuyersCard tenantId={tenant.id} />
          </Suspense>
        </div>

        <div className="lg:col-span-2">
          <DashboardChart 
            title="Tendência de Faturamento" 
            total={formatCurrency(totalRevenue)} 
            data={weeklyRevenue} 
          />
        </div>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Últimas Vendas
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              Acompanhe os pedidos mais recentes
            </p>
          </div>
          <Link href="/admin/orders">
            <Button
              variant="outline"
              size="sm"
              className="transition-all duration-300 hover:bg-muted/80 hover:shadow-sm h-9 px-4 rounded-xl border-zinc-200"
            >
              Ver Todas
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden border-zinc-200/50">
          {!recentOrders || recentOrders.length === 0 ? (
            <div className="text-center py-20 px-4 text-muted-foreground">
              <div className="mb-4 flex justify-center">
                <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground/40" />
                </div>
              </div>
              <p className="text-sm font-medium">
                Sua loja ainda não tem pedidos.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {recentOrders.map((order, idx) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}>
                  <div
                    className="flex items-center justify-between p-5 hover:bg-muted/30 transition-all duration-300 cursor-pointer group"
                    style={{ animation: `fadeInRight 0.5s ease-out ${idx * 0.1}s both` }}
                  >
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className="hidden sm:flex -space-x-2">
                        {order.items?.slice(0, 3).map((item) => {
                          const imageUrl = item.inventoryItem?.cardTemplate?.imageUrl || item.product?.imageUrl;
                          return (
                            <div
                              key={item.id}
                              className="h-12 w-9 rounded-lg border-2 border-background bg-card shadow-lg overflow-hidden shrink-0 ring-1 ring-border/30 transform hover:scale-110 hover:z-10 transition-transform duration-300"
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
                        {(order.items?.length || 0) > 3 && (
                          <div className="h-12 w-9 rounded-lg border-2 border-background bg-zinc-800 shadow-lg flex items-center justify-center text-2xs font-bold text-white shrink-0 ring-1 ring-border/30">
                            +{order.items!.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {order.customer?.name || "Cliente Desconhecido"}
                        </p>
                        <p className="text-2xs font-medium text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString(
                            "pt-BR",
                            { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
                          )} · {order.items?.length || 0}{" "}
                          {order.items?.length === 1 ? "item" : "itens"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <StatusBadge status={order.status} className="scale-90" />
                      <span className="text-base font-black font-mono tabular-nums w-24 text-right text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
