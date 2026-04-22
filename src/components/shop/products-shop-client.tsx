"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Package } from "lucide-react";
import { ProductStorefrontCard, StorefrontProduct } from "./product-storefront-card";
import { ProductCategory } from "@/lib/domain/entities/product";

interface ProductsShopClientProps {
  initialProducts: StorefrontProduct[];
  categories: ProductCategory[];
}

export function ProductsShopClient({ initialProducts, categories }: ProductsShopClientProps) {
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategoryId || p.category?.name === categories.find(c => c.id === selectedCategoryId)?.name;
      return matchesSearch && matchesCategory;
    });
  }, [initialProducts, search, selectedCategoryId, categories]);

  const grouped = useMemo(() => {
    const map = new Map<string, StorefrontProduct[]>();
    for (const p of filtered) {
      const cat = p.category?.name ?? "Sem categoria";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                !selectedCategoryId
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id === selectedCategoryId ? null : cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedCategoryId === cat.id
                    ? "bg-zinc-950 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <p className="font-bold text-foreground">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros de busca.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {grouped.map(([categoryName, products]) => (
            <section key={categoryName}>
              {grouped.length > 1 && (
                <h2 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
                  <span className="h-1 w-6 bg-primary rounded-full inline-block" />
                  {categoryName}
                </h2>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {products.map((product) => (
                  <ProductStorefrontCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
