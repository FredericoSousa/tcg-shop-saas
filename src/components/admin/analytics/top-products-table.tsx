"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShoppingCart } from "lucide-react";

interface TopProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  count: number;
  revenue: number;
}

export function TopProductsTable() {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopProducts() {
      try {
        const response = await fetch("/api/admin/reports/top-products?limit=5");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setProducts(result.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch top products", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTopProducts();
  }, []);

  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 dark:border-zinc-800/50 shadow-sm col-span-1 md:col-span-2 lg:col-span-1 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Top 5 Produtos</CardTitle>
            <CardDescription className="text-xs font-medium">Mais vendidos em faturamento</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-tighter text-[9px]">
            Popularidade
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-medium">
              Nenhuma venda registrada ainda.
            </div>
          ) : (
            products.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-4 group cursor-pointer">
                <div className="relative h-12 w-10 flex-shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden shadow-sm group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground font-bold">TCG</div>
                  )}
                  <div className="absolute top-0 left-0 bg-primary/90 backdrop-blur-sm text-white text-[8px] font-black px-1.5 py-0.5 rounded-br-lg shadow-sm">
                    #{idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-primary transition-colors leading-tight mb-0.5">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground/80 flex items-center gap-1 uppercase tracking-tighter">
                      <ShoppingCart className="h-2.5 w-2.5" />
                      {product.count} vendidos
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-primary tabular-nums">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.revenue)}
                  </p>
                  <p className="text-[9px] text-emerald-500 font-black flex items-center justify-end gap-0.5 uppercase tracking-tight">
                    <TrendingUp className="h-2.5 w-2.5" />
                    +5%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
