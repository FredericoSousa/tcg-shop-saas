"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { CartItem } from "./pos-client";

type ProductType = Omit<CartItem, "quantity"> & {
  category?: { name: string } | null;
};

interface ProductSearchProps {
  onSelect: (product: Omit<CartItem, "quantity">) => void;
}

export function ProductSearch({ onSelect }: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (query.length < 2) {
        // Fetch all products if query is empty or too short
        if (query.length === 0) {
           handleSearch("");
        }
        return;
      }
      handleSearch(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  // Initial load
  useEffect(() => {
    handleSearch("");
  }, []);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/pos/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-hidden">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar produto pelo nome..."
          className="pl-9 h-11"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:border-primary/50 transition-colors group cursor-pointer"
                onClick={() => onSelect(product)}
              >
                <div className="h-14 w-14 rounded-md bg-muted flex-shrink-0 overflow-hidden border">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      width={56}
                      height={56}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground uppercase">Sem Foto</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{product.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{product.category?.name || "Sem Categoria"}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">
                    R$ {Number(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum produto encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
