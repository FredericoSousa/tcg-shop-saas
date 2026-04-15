"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BuylistItem } from "@/lib/domain/entities/buylist";
import { BuylistCard } from "./buylist-card";
import { SellCartDrawer } from "./sell-cart-drawer";
import { PackageSearch, Search } from "lucide-react";

interface BuylistClientProps {
  initialItems: BuylistItem[];
}

export function BuylistClient({ initialItems }: BuylistClientProps) {
  const [search, setSearch] = useState("");

  const filteredItems = initialItems.filter((item) =>
    item.cardTemplate?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      <div className="max-w-md relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Buscar cartas pelo nome..."
          className="pl-10 h-12 rounded-xl shadow-sm border-input font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
          <PackageSearch className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg">Nenhum item encontrado na buylist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {filteredItems.map((item) => (
            <BuylistCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <SellCartDrawer />
    </div>
  );
}
