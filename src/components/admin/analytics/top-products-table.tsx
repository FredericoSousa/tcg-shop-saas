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
    <Card className="bg-white/50 backdrop-blur-sm border-white/20 shadow-sm col-span-1 md:col-span-2 lg:col-span-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold">Top 5 Produtos</CardTitle>
            <CardDescription>Mais vendidos em faturamento</CardDescription>
          </div>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 font-bold">
            Popularidade
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-medium">
              Nenhuma venda registrada ainda.
            </div>
          ) : (
            products.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-4 group">
                <div className="relative h-12 w-10 flex-shrink-0 bg-muted rounded overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">?</div>
                  )}
                  <div className="absolute top-0 left-0 bg-primary text-white text-[8px] font-bold px-1 rounded-br-md">
                    #{idx + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{product.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                      <ShoppingCart className="h-2.5 w-2.5" />
                      {product.count} vendidos
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(product.revenue)}
                  </p>
                  <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5" />
                    High
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
