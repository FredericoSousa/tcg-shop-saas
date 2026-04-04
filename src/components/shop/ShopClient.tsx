"use client";

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

export function ShopClient({ tenantId, initialInventory }: { tenantId: string, initialInventory: any[] }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSet, setSelectedSet] = useState<string | null>(null);

  // Track recently added items for visual feedback
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);

  const { addItem } = useCart();

  const {
    data: inventory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory", {
        headers: {
          "x-tenant-id": tenantId || "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    initialData: initialInventory,
    staleTime: 60000,
  });

  const { colors, types, sets } = useMemo(() => {
    if (!inventory) return { colors: [], types: [], sets: [] };

    const colorSet = new Set<string>();
    const typeSet = new Set<string>();
    const setSet = new Set<string>();

    inventory.forEach((item: ShopItem) => {
      const meta = item.cardTemplate?.metadata;
      if (meta?.colors && Array.isArray(meta.colors)) {
        meta.colors.forEach((c: string) => colorSet.add(c));
      }
      if (meta?.type_line) {
        const mainType = meta.type_line.split("—")[0].trim().split(" ")[0];
        if (mainType) typeSet.add(mainType);
      }
      if (item.cardTemplate?.set) {
        setSet.add(item.cardTemplate.set.toUpperCase());
      }
    });

    return {
      colors: Array.from(colorSet).sort(),
      types: Array.from(typeSet).sort(),
      sets: Array.from(setSet).sort(),
    };
  }, [inventory]);

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item: ShopItem) => {
      const meta = item.cardTemplate?.metadata;
      if (
        selectedColor &&
        (!meta?.colors || !meta.colors.includes(selectedColor))
      )
        return false;
      if (
        selectedType &&
        (!meta?.type_line || !meta.type_line.includes(selectedType))
      )
        return false;
      if (selectedSet && item.cardTemplate?.set?.toUpperCase() !== selectedSet)
        return false;
      return true;
    });
  }, [inventory, selectedColor, selectedType, selectedSet]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedColor, selectedType, selectedSet]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInventory.length / ITEMS_PER_PAGE),
  );
  const paginatedItems = filteredInventory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <aside className="w-full md:w-64 shrink-0 space-y-8 bg-white p-6 rounded-xl border shadow-sm h-[600px]">
          <Skeleton className="h-8 w-1/2 mb-4" />
          <div className="flex flex-wrap gap-2 mb-8">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-8 w-1/2 mb-4" />
          <div className="flex flex-wrap gap-2 mb-8">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-14" />
          </div>
          <Skeleton className="h-8 w-1/2 mb-4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </aside>
        <div className="flex-1 w-full">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col"
              >
                <Skeleton className="aspect-[2/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <Skeleton className="h-6 w-1/2 mt-auto" />
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-red-500 bg-red-50 rounded-xl border-2 border-red-200 animate-in fade-in duration-500">
        <div className="mb-4 p-3 bg-red-100 rounded-full">
          <AlertCircle className="w-12 h-12 opacity-90" />
        </div>
        <h3 className="text-xl font-bold mb-2">Erro ao carregar o estoque</h3>
        <p className="text-sm font-medium opacity-80 mb-6">
          Por favor, tente novamente mais tarde.
        </p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-red-300 hover:bg-red-100 text-red-700 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

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
                  onClick={() => setSelectedColor(null)}
                >
                  Todas
                </Badge>
                {colors.map((c) => (
                  <Badge
                    key={c}
                    variant={selectedColor === c ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 pb-0.5"
                    onClick={() => setSelectedColor(c)}
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
                  onClick={() => setSelectedType(null)}
                >
                  Todos
                </Badge>
                {types.map((t) => (
                  <Badge
                    key={t}
                    variant={selectedType === t ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80 pb-0.5"
                    onClick={() => setSelectedType(t)}
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
                  onClick={() => setSelectedSet(null)}
                >
                  Todas as Edições
                </button>
                {sets.map((s) => (
                  <button
                    key={s}
                    className={`text-left text-sm py-1 font-medium transition-colors ${selectedSet === s ? "text-primary" : "text-muted-foreground hover:text-primary/70"}`}
                    onClick={() => setSelectedSet(s)}
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
            onClick={() => {
              setSelectedColor(null);
              setSelectedType(null);
              setSelectedSet(null);
            }}
          >
            Limpar Filtros
          </Button>
        )}
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
            {filteredInventory.length}{" "}
            {filteredInventory.length === 1 ? "card" : "cards"}
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
              <Button
                onClick={() => {
                  setSelectedColor(null);
                  setSelectedType(null);
                  setSelectedSet(null);
                }}
              >
                Limpar Todos os Filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {paginatedItems.map((item: ShopItem) => {
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
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cardTemplate.imageUrl}
                          alt={item.cardTemplate.name}
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
