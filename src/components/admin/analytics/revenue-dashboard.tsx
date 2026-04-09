"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package, Box, DollarSign } from "lucide-react";

interface RevenueData {
  byCategory: { category: string; count: number; revenue: number }[];
  bySet: { set: string; count: number; revenue: number }[];
  totalRevenue: number;
  totalItemsSold: number;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];

export function RevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/reports/revenue");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setData(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch revenue data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
        <Skeleton className="md:col-span-2 h-[400px] rounded-xl" />
        <Skeleton className="md:col-span-2 h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:border-primary/20">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-12 w-12 text-primary" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-primary">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 font-bold">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-500">+12.5%</span> 
              <span className="opacity-60 ml-1">vendas no período</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:border-blue-500/20">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Package className="h-12 w-12 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Itens Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-blue-500">{data.totalItemsSold}</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-tighter opacity-70">Volume total do estoque</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:border-emerald-500/20">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Box className="h-12 w-12 text-emerald-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Categorias Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-500">{data.byCategory.length}</div>
            <p className="text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-tighter opacity-70">Diversificação de catálogo</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 shadow-sm overflow-hidden relative group transition-all duration-300 hover:shadow-lg hover:border-purple-500/20">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp className="h-12 w-12 text-purple-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-purple-500">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(data.totalRevenue / (data.totalItemsSold || 1))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 font-bold uppercase tracking-tighter opacity-70">Média por transação</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Category Chart */}
        <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 shadow-sm transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Faturamento por Categoria</CardTitle>
            <CardDescription>Distribuição proporcional das vendas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] min-h-[300px]">
            <div className="w-full h-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <PieChart>
                <Pie
                  data={data.byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="category"
                  stroke="none"
                >
                  {data.byCategory.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'var(--card)', color: 'var(--foreground)' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingBottom: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
        </Card>

        {/* Top Sets Chart */}
        <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 shadow-sm transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Top Edições (Singles)</CardTitle>
            <CardDescription>As 5 edições que mais faturaram</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] min-h-[300px]">
            <div className="w-full h-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
              <BarChart
                data={data.bySet.slice(0, 5)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} stroke="rgb(156 163 175)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="set" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fontSize: 11, fontWeight: 'bold', fill: 'rgb(156 163 175)' }}
                />
                <Tooltip 
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   formatter={(value: any) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value))}
                   cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'var(--card)', color: 'var(--foreground)' }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]} barSize={32}>
                  {data.bySet.slice(0, 5).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
