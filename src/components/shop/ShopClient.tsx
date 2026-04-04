"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCart } from "@/store/useCart";
import { CartDrawer } from "./CartDrawer";
import { SetBadge } from "@/components/ui/set-badge";
import {
  PackageOpen,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";

const ITEMS_PER_PAGE = 20;

type ShopItem = {
  id: string;
  price: number;
  quantity: number;
  condition: string;
  language: string;
  cardTemplate: {
    name: string;
    set: string;
    imageUrl: string | null;
    metadata: {
      colors?: string[];
      type_line?: string;
      foil?: boolean;
    } | null;
  } | null;
};

export function ShopClient({ 
  tenantId, 
  initialInventory, 
  availableFilters,
  pageCount,
  totalItems,
  currentPage 
}: { 
  tenantId: string, 
  initialInventory: any[],
  availableFilters: { colors: string[], types: string[], sets: string[] },
  pageCount: number,
  totalItems: number,
  currentPage: number
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract selected filters from searchParams
  const selectedColor = searchParams.get("color");
  const selectedType = searchParams.get("type");
  const selectedSet = searchParams.get("set");

  // Track recently added items for visual feedback
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const { addItem } = useCart();

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1"); // Reset to page 1 on filter
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: true });
  }, [pathname, router, searchParams]);

  const { colors, types, sets } = availableFilters;
  const filteredInventory = initialInventory;
  const totalPages = pageCount;


  const handleAddToCart = (item: ShopItem) => {
    addItem({
      inventoryId: item.id,
      name: item.cardTemplate?.name || "Card",
      set: item.cardTemplate?.set || "N/A",
      imageUrl: item.cardTemplate?.imageUrl || null,
      price: item.price,
      quantity: 1,
      maxStock: item.quantity,
    });

    // Show visual feedback
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <aside className="w-full md:w-64 shrink-0 bg-white p-4 rounded-xl border shadow-sm sticky top-6">
        <Accordion
          multiple
          defaultValue={["color", "type", "set"]}
          className="w-full"
        >
          <AccordionItem value="color" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
              Cores
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={selectedColor === null ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => updateFilters("color", null)}
                >
                  Todas
                </Badge>
                {colors.map((c) => (
                  <Badge
                    key={c}
                    variant={selectedColor === c ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 pb-0.5"
                    onClick={() => updateFilters("color", c)}
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="type" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
              Tipos
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={selectedType === null ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => updateFilters("type", null)}
                >
                  Todos
                </Badge>
                {types.map((t) => (
                  <Badge
                    key={t}
                    variant={selectedType === t ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 pb-0.5"
                    onClick={() => updateFilters("type", t)}
                  >
                    {t}
                  </Badge>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="set" className="border-b-0">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
              Edições
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1.5 border-l-2 pl-3 mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <button
                  className={`text-left text-sm py-1 font-medium transition-colors ${selectedSet === null ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                  onClick={() => updateFilters("set", null)}
                >
                  Todas as Edições
                </button>
                {sets.map((s) => (
                  <button
                    key={s}
                    className={`text-left text-sm py-1 font-medium transition-colors ${selectedSet === s ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                    onClick={() => updateFilters("set", s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {(selectedColor || selectedType || selectedSet) && (
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

      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
            {totalItems}{" "}
            {totalItems === 1 ? "card" : "cards"}
            {totalPages > 1 && (
              <>
                {" "}
                · Página {currentPage} de {totalPages}
              </>
            )}
          </span>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-dashed text-muted-foreground">
            <PackageOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground">
              Nenhum card encontrado
            </p>
            <p className="text-sm mb-6">
              Tente ajustar ou limpar os filtros para ver mais resultados.
            </p>
            {(selectedColor || selectedType || selectedSet) && (
              <Button onClick={clearFilters}>
                Limpar Todos os Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredInventory.map((item: ShopItem) => {
                const stockStatus =
                  item.quantity > 3
                    ? "text-green-600 bg-green-50"
                    : item.quantity > 1
                      ? "text-amber-600 bg-amber-50"
                      : "text-red-600 bg-red-50";

                return (
                  <div
                    key={item.id}
                    className="group relative flex flex-col bg-white rounded-xl shadow-sm overflow-hidden border hover:shadow-lg transition-all hover:-translate-y-1 duration-300"
                  >
                    <div className="aspect-[2/3] w-full bg-muted/30 relative overflow-hidden flex items-center justify-center group-hover:bg-muted/50 transition-colors">
                      {item.cardTemplate?.imageUrl ? (
                        <Image
                          src={item.cardTemplate.imageUrl}
                          alt={item.cardTemplate.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 text-xs font-medium space-y-2">
                          <div className="w-12 h-16 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                            ?
                          </div>
                          <span>Sem Imagem</span>
                        </div>
                      )}
                      {item.cardTemplate?.metadata?.foil && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-300 to-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow z-10">
                          FOIL
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1.5 flex-1">
                      <h3
                        className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem]"
                        title={item.cardTemplate?.name}
                      >
                        {item.cardTemplate?.name}
                      </h3>
                      <div className="flex items-center flex-wrap gap-1 mt-auto">
                        <span
                          className="text-[10px] font-semibold px-1 py-0.5 bg-muted rounded border border-gray-200 truncate max-w-[100px] flex items-center justify-center cursor-default"
                          title={
                            (item.cardTemplate?.metadata as any)?.set_name ||
                            item.cardTemplate?.set ||
                            ""
                          }
                        >
                          <SetBadge
                            setCode={item.cardTemplate?.set || ""}
                            className="gap-1"
                            iconClassName="h-3 w-3"
                            textClassName="text-[10px] font-semibold text-foreground tracking-normal m-0 p-0"
                          />
                        </span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted rounded border border-gray-200"
                          title="Condição"
                        >
                          {item.condition === "NM"
                            ? "🌟 NM"
                            : item.condition === "SP"
                              ? "⭐ SP"
                              : item.condition}
                        </span>
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted rounded border border-gray-200"
                          title="Idioma"
                        >
                          {item.language === "PT"
                            ? "🇧🇷 PT"
                            : item.language === "EN"
                              ? "🇺🇸 EN"
                              : item.language}
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t flex flex-col gap-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-lg text-primary leading-none mb-1">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(item.price)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${stockStatus}`}
                          >
                            {item.quantity} em estoque
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant={addedItems[item.id] ? "default" : "default"}
                          className={`w-full font-bold text-xs h-8 transition-all duration-300 ease-out hover:scale-105 active:scale-95 ${addedItems[item.id] ? "bg-green-600 hover:bg-green-700 text-white shadow-md" : "hover:shadow-md"}`}
                          onClick={() => handleAddToCart(item)}
                          aria-label={
                            addedItems[item.id]
                              ? `${item.cardTemplate?.name} adicionado ao carrinho`
                              : `Adicionar ${item.cardTemplate?.name} ao carrinho`
                          }
                        >
                          {addedItems[item.id] ? (
                            <span className="flex items-center gap-1.5 animate-in fade-in duration-300">
                              <Check className="w-3.5 h-3.5" />
                              <span>Adicionado</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5">
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>Comprar</span>
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show first, last, current, and neighbors
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                    if (idx > 0 && page - (arr[idx - 1] as number) > 1)
                      acc.push("ellipsis");
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`e-${idx}`}
                        className="px-1 text-muted-foreground text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={currentPage === item ? "default" : "outline"}
                        size="icon"
                        className="h-9 w-9 text-sm font-bold transition-all duration-200 hover:scale-110 active:scale-95"
                        onClick={() => handlePageChange(item as number)}
                        aria-label={`Ir para página ${item}`}
                        aria-current={currentPage === item ? "page" : undefined}
                      >
                        {item}
                      </Button>
                    ),
                  )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 transition-all duration-200 hover:scale-110 active:scale-95"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <CartDrawer />
      </div>
    </div>
  );
}
