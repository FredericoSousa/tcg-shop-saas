"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { SetBadge } from "@/components/ui/set-badge";
import { cn } from "@/lib/utils";
import {
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import Image from "next/image";
import { BuylistItem } from "@/lib/domain/entities/buylist";
import { BuylistCard } from "./buylist-card";
import { SellCartDrawer } from "./sell-cart-drawer";
import { LiveSearch } from "@/components/storefront/live-search";
import { GetStorefrontFiltersResponse } from "@/lib/application/use-cases/get-storefront-filters.use-case";

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

  const [setSearch, setSetSearch] = useState("");

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
        <Accordion
          multiple
          defaultValue={["color", "type", "set"]}
          className="w-full"
        >
          <AccordionItem value="color" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2 text-foreground">
              Cores
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={selectedColors.length === 0 ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => toggleColor(null)}
                >
                  Todas
                </Badge>
                {colors.map((c) => (
                  <button
                    key={c}
                    title={c}
                    className={`h-8 w-8 rounded-full transition-all flex items-center justify-center overflow-hidden bg-white/20 border border-muted-foreground/20 ${selectedColors.includes(c)
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105"
                      }`}
                    onClick={() => toggleColor(c)}
                  >
                    <Image
                      src={`https://svgs.scryfall.io/card-symbols/${c}.svg`}
                      alt={c}
                      width={32}
                      height={32}
                      className="w-full h-full object-contain mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="type" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2 text-foreground">
              Tipos
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={selectedTypes.length === 0 ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => toggleType(null)}
                >
                  Todos
                </Badge>
                {types.map((t) => (
                  <Badge
                    key={t}
                    variant={selectedTypes.includes(t) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 pb-0.5"
                    onClick={() => toggleType(t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="set" className="border-b-0">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2 text-foreground">
              Edições
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1.5 border-l-2 pl-3 mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <Input
                  placeholder="Buscar edição..."
                  value={setSearch}
                  onChange={(e) => setSetSearch(e.target.value)}
                  className="h-8 mb-2 text-xs"
                />
                <button
                  className={`text-left w-full py-1.5 px-2 rounded-md transition-colors flex items-center hover:bg-muted/50 ${selectedSet === null ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => updateFilters("set", null)}
                >
                  <span className="text-xs font-bold uppercase font-mono tracking-wider ml-[1.35rem]">
                    Todas as Edições
                  </span>
                </button>
                {sets
                  .filter((s) =>
                    s.toLowerCase().includes(setSearch.toLowerCase()),
                  )
                  .map((s) => (
                    <button
                      key={s}
                      className={`text-left w-full py-1 px-2 rounded-md transition-colors flex items-center hover:bg-muted/50 ${selectedSet === s ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => updateFilters("set", s)}
                    >
                      <SetBadge
                        setCode={s}
                        iconClassName="h-4 w-4 drop-shadow-none opacity-80"
                        textClassName={
                          selectedSet === s ? "text-primary font-bold" : ""
                        }
                      />
                    </button>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {(selectedColors.length > 0 ||
          selectedTypes.length > 0 ||
          selectedSet) && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4 text-xs text-muted-foreground"
              onClick={clearFilters}
            >
              Limpar Filtros
            </Button>
          )}
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
                <Button variant="outline" size="sm" className="md:hidden flex items-center justify-center gap-2 font-bold shadow-sm h-9 px-4 transition-colors text-sm">
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
                {/* Mobile Filters Repeat - could be componentized if needed */}
                <Accordion
                  multiple
                  defaultValue={["color", "type", "set"]}
                  className="w-full"
                >
                  {/* ... same as desktop filters ... */}
                  <AccordionItem value="color" className="border-b-0 pb-2">
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-2 text-foreground">
                      Cores
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {colors.map((c) => (
                          <button
                            key={c}
                            title={c}
                            className={`h-8 w-8 rounded-full transition-all flex items-center justify-center overflow-hidden bg-white/20 border border-muted-foreground/20 ${selectedColors.includes(c)
                              ? "ring-2 ring-primary ring-offset-2 scale-110"
                              : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105"
                              }`}
                            onClick={() => toggleColor(c)}
                          >
                            <Image
                              src={`https://svgs.scryfall.io/card-symbols/${c}.svg`}
                              alt={c}
                              width={32}
                              height={32}
                              className="w-full h-full object-contain mix-blend-multiply"
                            />
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-4 text-xs text-muted-foreground"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
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
