"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Plus } from "lucide-react";
import Image from "next/image";
import { CartItem } from "./pos-client";
import { motion } from "framer-motion";

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
      const result = await response.json();
      if (result.success && result.data) {
        setResults(result.data);
      }
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
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
            <p className="text-sm font-medium text-muted-foreground animate-pulse">Buscando no catálogo...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
            {results.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="group relative flex flex-col bg-background border rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                onClick={() => onSelect(product)}
              >
                <div className="aspect-square relative bg-muted overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sem Imagem</span>
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      <Plus className="h-5 w-5" />
                    </div>
                  </div>
                </div>
                
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex-1 min-w-0 mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">
                      {product.category?.name || "Geral"}
                    </p>
                    <h3 className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-muted">
                    <span className="text-base font-black text-foreground">
                      R$ {Number(product.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="h-6 w-6 rounded-md bg-muted group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                      <Plus className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-50">
            <div className="bg-muted p-4 rounded-full">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
