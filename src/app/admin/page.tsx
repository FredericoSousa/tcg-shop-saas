import "reflect-metadata";
import { Suspense } from "react";
import { container } from "@/lib/infrastructure/container";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { LayoutDashboard, Package, ShoppingCart, DollarSign, TrendingUp, Calendar, PieChart as PieChartIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getAdminContext } from "@/lib/tenant-server";
import { DashboardChart } from "@/components/admin/dashboard-chart";
import { RevenueDashboard } from "@/components/admin/analytics/revenue-dashboard";
import { TopProductsTable } from "@/components/admin/analytics/top-products-table";
import { TopBuyersCard } from "@/components/admin/analytics/top-buyers-card";
import { GetDashboardSummaryUseCase } from "@/lib/application/use-cases/get-dashboard-summary.use-case";
import { ListOrdersUseCase } from "@/lib/application/use-cases/list-orders.use-case";


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

  const kpis = [
    {
      title: "Cartas em Estoque",
      value: inventoryCount.toLocaleString("pt-BR"),
      icon: Package,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Valor do Estoque",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalInventoryValue),
      icon: TrendingUp,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Vendas Realizadas",
      value: ordersCount.toLocaleString("pt-BR"),
      icon: ShoppingCart,
      color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      title: "Receita Total",
      value: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(totalRevenue),
      icon: DollarSign,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
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
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => (
          <div
            key={kpi.title}
            className="group relative overflow-hidden rounded-2xl bg-card/40 border border-zinc-200/50 shadow-sm backdrop-blur-md bg-gradient-to-br from-card/80 to-card/40 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 p-6"
            style={{
              animation: `fadeInUp 0.6s ease-out ${idx * 0.15}s both`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
            
            <div className="relative flex items-start justify-between">
              <div
                className={`p-3 rounded-xl border shadow-sm transition-all duration-500 group-hover:scale-110 group-hover:shadow-md ${kpi.color}`}
              >
                <kpi.icon className="h-6 w-6" />
              </div>
              <div className="text-right flex-1 min-w-0 ml-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  {kpi.title}
                </p>
                <p className="text-2xl font-black tracking-tight leading-none tabular-nums text-foreground group-hover:text-primary transition-colors">
                  {kpi.value}
                </p>
                <div className="flex items-center justify-end gap-1 mt-3">
                   <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-500">
                     <TrendingUp className="h-3 w-3" />
                     +5%
                   </div>
                   <span className="text-[10px] text-muted-foreground/60">vs ontem</span>
                </div>
              </div>
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
            total={new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalRevenue)} 
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
                          <div className="h-12 w-9 rounded-lg border-2 border-background bg-zinc-800 shadow-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-1 ring-border/30">
                            +{order.items!.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {order.customer?.name || "Cliente Desconhecido"}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
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
      </section>
    </div>
  );
}
