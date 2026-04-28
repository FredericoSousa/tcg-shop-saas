"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PackageOpen, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { BuylistItem } from "@/lib/domain/entities/buylist";
import { BuylistCard } from "./buylist-card";
import { SellCartDrawer } from "./sell-cart-drawer";
import { LiveSearch } from "@/components/storefront/live-search";
import { GetStorefrontFiltersResponse } from "@/lib/application/use-cases/storefront/get-storefront-filters.use-case";
import { BuylistFilters } from "./buylist-filters";

interface BuylistClientProps {
  initialItems: BuylistItem[];
  availableFilters: GetStorefrontFiltersResponse;
  pageCount: number;
  totalItems: number;
  currentPage: number;
}

export function BuylistClient({
  initialItems,
  availableFilters,
  pageCount,
  totalItems,
  currentPage,
}: BuylistClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedColors = searchParams.get("color")?.split(",") || [];
  const selectedTypes = searchParams.get("type")?.split(",") || [];
  const selectedSet = searchParams.get("set");
  const searchQuery = searchParams.get("q") || "";

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleColor = (c: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (c === null) {
      params.delete("color");
    } else {
      let current = params.get("color")?.split(",") || [];
      if (current.includes(c)) {
        current = current.filter((x) => x !== c);
      } else {
        current.push(c);
      }
      if (current.length > 0) {
        params.set("color", current.join(","));
      } else {
        params.delete("color");
      }
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleType = (t: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === null) {
      params.delete("type");
    } else {
      let current = params.get("type")?.split(",") || [];
      if (current.includes(t)) {
        current = current.filter((x) => x !== t);
      } else {
        current.push(t);
      }
      if (current.length > 0) {
        params.set("type", current.join(","));
      } else {
        params.delete("type");
      }
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.replace(`${pathname}?${params.toString()}`, { scroll: true });
    },
    [pathname, router, searchParams],
  );

  const { colors, types, sets } = availableFilters;

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start relative">
      <aside className="hidden md:block w-full md:w-64 shrink-0 bg-white p-4 rounded-xl border shadow-sm sticky top-6">
        <BuylistFilters
          colors={colors}
          types={types}
          sets={sets}
          selectedColors={selectedColors}
          selectedTypes={selectedTypes}
          selectedSet={selectedSet}
          onToggleColor={toggleColor}
          onToggleType={toggleType}
          onSelectSet={(s) => updateFilters("set", s)}
          onClear={clearFilters}
        />
      </aside>

      <div className="flex-1 pb-32">
        <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b pb-6">
          <div className="flex flex-col sm:flex-row w-full gap-4 xl:w-auto">
            <div className="relative w-full sm:w-80">
              <LiveSearch
                defaultValue={searchQuery}
                onSearch={(q) => updateFilters("q", q)}
                inputClassName="h-9 w-full bg-background shadow-sm border-input"
                placeholder="Buscar cartas pelo nome..."
                searchPath="/api/buylist/search"
                resultPathType="buylist"
              />
            </div>
          </div>
          <div className="flex flex-row justify-between xl:justify-end items-center gap-4 w-full xl:w-auto">
            <Sheet>
              <SheetTrigger render={
                <Button variant="outline" size="sm" className="md:hidden flex items-center justify-center gap-2 font-bold shadow-sm min-h-[44px] px-4 transition-colors text-sm">
                  <Filter className="w-4 h-4" /> Filtros
                </Button>
              } />
              <SheetContent
                side="left"
                className="w-[85vw] sm:max-w-[350px] overflow-y-auto px-4 py-6"
              >
                <SheetHeader className="mb-6 text-left">
                  <SheetTitle className="text-2xl font-black">
                    Filtros da Buylist
                  </SheetTitle>
                </SheetHeader>
                <BuylistFilters
                  colors={colors}
                  types={types}
                  sets={sets}
                  selectedColors={selectedColors}
                  selectedTypes={selectedTypes}
                  selectedSet={selectedSet}
                  onToggleColor={toggleColor}
                  onToggleType={toggleType}
                  onSelectSet={(s) => updateFilters("set", s)}
                  onClear={clearFilters}
                />
              </SheetContent>
            </Sheet>

            <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
              {totalItems} {totalItems === 1 ? "card" : "cards"}
              {pageCount > 1 && (
                <>
                  {" "}
                  · Página {currentPage} de {pageCount}
                </>
              )}
            </span>
          </div>
        </div>

        {initialItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed text-muted-foreground">
            <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground">
              Nenhum item encontrado na buylist.
            </p>
            <p className="text-sm mb-6">
              Tente ajustar ou limpar os filtros para ver mais resultados.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {initialItems.map((item) => (
                <BuylistCard key={item.id} item={item} />
              ))}
            </div>

            {pageCount > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-16 border-t pt-10">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex items-center gap-1.5 mx-2">
                    {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                      let pageNum: number;
                      if (pageCount <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= pageCount - 2) {
                        pageNum = pageCount - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-xl font-bold transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm",
                            currentPage === pageNum ? "bg-zinc-950 text-white" : "bg-white hover:bg-zinc-50"
                          )}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    {pageCount > 5 && (
                      <div className="flex items-center gap-2">
                        {((currentPage < pageCount - 2 && pageCount > 5) || (currentPage < 3 && pageCount > 5)) && (
                          <span className="text-zinc-400 font-bold px-1">...</span>
                        )}
                        {currentPage < pageCount - 2 && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl font-bold transition-all duration-200 hover:scale-110 active:scale-95 bg-white shadow-sm"
                            onClick={() => handlePageChange(pageCount)}
                          >
                            {pageCount}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 shadow-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pageCount}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <div className="text-xs font-bold text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-dashed tracking-wide uppercase">
                  Mostrando {initialItems.length} de {totalItems} cards
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <SellCartDrawer />
    </div>
  );
}
