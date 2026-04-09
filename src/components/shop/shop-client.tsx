"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useCart } from "@/store/use-cart";
import { SetBadge } from "@/components/ui/set-badge";
import { LanguageBadge } from "@/components/ui/language-badge";
import { cn } from "@/lib/utils";
import {
  PackageOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Filter,
  Search,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import { QuickAddButton } from "@/components/shop/quick-add-button";


type ShopItem = {
  id: string;
  price: number;
  quantity: number;
  condition: string;
  language: string;
  extras?: string[];
  cardTemplate: {
    name: string;
    set: string;
    imageUrl: string | null;
    backImageUrl?: string | null;
    metadata: {
      colors?: string[];
      type_line?: string;
      foil?: boolean;
    } | null;
  } | null;
};

export function ShopClient({
  initialInventory,
  availableFilters,
  pageCount,
  totalItems,
  currentPage,
}: {
  tenantId: string;
  initialInventory: ShopItem[];
  availableFilters: {
    colors: string[];
    types: string[];
    subtypes: string[];
    extras: string[];
    sets: string[];
    languages: string[];
  };
  pageCount: number;
  totalItems: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Extract selected filters from searchParams
  const selectedColors = searchParams.get("color")?.split(",") || [];
  const selectedTypes = searchParams.get("type")?.split(",") || [];
  const selectedSubtypes = searchParams.get("subtype")?.split(",") || [];
  const selectedExtras = searchParams.get("extras")?.split(",") || [];
  const selectedLanguages = searchParams.get("language")?.split(",") || [];
  const selectedSet = searchParams.get("set");
  const searchQuery = searchParams.get("q") || "";
  const sortOption = searchParams.get("sort") || "name_asc";

  // Track recently added items for visual feedback
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const [setSearch, setSetSearch] = useState("");
  const [subtypeSearch, setSubtypeSearch] = useState("");
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
  const { addItem } = useCart();

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1"); // Reset to page 1 on filter
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

  const toggleSubtype = (st: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (st === null) {
      params.delete("subtype");
    } else {
      let current = params.get("subtype")?.split(",") || [];
      if (current.includes(st)) {
        current = current.filter((x) => x !== st);
      } else {
        current.push(st);
      }
      if (current.length > 0) {
        params.set("subtype", current.join(","));
      } else {
        params.delete("subtype");
      }
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleExtras = (ex: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (ex === null) {
      params.delete("extras");
    } else {
      let current = params.get("extras")?.split(",") || [];
      if (current.includes(ex)) {
        current = current.filter((x) => x !== ex);
      } else {
        current.push(ex);
      }
      if (current.length > 0) {
        params.set("extras", current.join(","));
      } else {
        params.delete("extras");
      }
    }
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleLanguage = (l: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (l === null) {
      params.delete("language");
    } else {
      let current = params.get("language")?.split(",") || [];
      if (current.includes(l)) {
        current = current.filter((x) => x !== l);
      } else {
        current.push(l);
      }
      if (current.length > 0) {
        params.set("language", current.join(","));
      } else {
        params.delete("language");
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

  const { colors, types, subtypes, extras, sets, languages } = availableFilters;
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
      <aside className="hidden md:block w-full md:w-64 shrink-0 bg-white p-4 rounded-xl border shadow-sm sticky top-6">
        <Accordion
          multiple
          defaultValue={["color", "type", "subtype", "extras", "set"]}
          className="w-full"
        >
          <AccordionItem value="color" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
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
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
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

          <AccordionItem value="subtype" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
              Subtipos
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-1.5 border-l-2 pl-3 mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <Input
                  placeholder="Buscar subtipo..."
                  value={subtypeSearch}
                  onChange={(e) => setSubtypeSearch(e.target.value)}
                  className="h-8 mb-2 text-xs"
                />

                {subtypes
                  .filter((st) =>
                    st.toLowerCase().includes(subtypeSearch.toLowerCase()),
                  )
                  .map((st) => (
                    <button
                      key={st}
                      className={`text-left w-full py-1 px-2 rounded-md transition-colors flex items-center gap-2 hover:bg-muted/50 ${selectedSubtypes.includes(st) ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                      onClick={() => toggleSubtype(st)}
                    >
                      {selectedSubtypes.includes(st) && (
                        <Check className="h-3 w-3 shrink-0" />
                      )}
                      <span className="text-xs font-medium">{st}</span>
                    </button>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {extras.length > 0 && (
            <AccordionItem value="extras" className="border-b-0 pb-2">
              <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                Extras
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge
                    variant={
                      selectedExtras.length === 0 ? "default" : "outline"
                    }
                    className="cursor-pointer hover:opacity-80 pb-0.5"
                    onClick={() => toggleExtras(null)}
                  >
                    Todos
                  </Badge>
                  {extras.map((ex) => (
                    <Badge
                      key={ex}
                      variant={
                        selectedExtras.includes(ex) ? "default" : "outline"
                      }
                      className="cursor-pointer hover:opacity-80 pb-0.5"
                      onClick={() => toggleExtras(ex)}
                    >
                      {ex}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="language" className="border-b-0 pb-2">
            <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
              Idiomas
            </AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={selectedLanguages.length === 0 ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => toggleLanguage(null)}
                >
                  Todos
                </Badge>
                {languages.map((l) => (
                  <button
                    key={l}
                    onClick={() => toggleLanguage(l)}
                    className="focus:outline-none"
                  >
                    <LanguageBadge
                      language={l}
                      showCode={true}
                      className={cn(
                        "cursor-pointer transition-all hover:scale-105",
                        selectedLanguages.includes(l)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white hover:bg-muted"
                      )}
                    />
                  </button>
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
          selectedSubtypes.length > 0 ||
          selectedExtras.length > 0 ||
          selectedLanguages.length > 0 ||
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cartas pelo nome..."
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") updateFilters("q", localQuery);
                }}
                className="pl-9 h-9 border-input shadow-sm w-full bg-background"
              />
            </div>
            <select
              className="h-9 px-3 py-1.5 rounded-md border border-input bg-background shadow-sm text-sm font-medium focus-visible:outline-none focus:ring-1 focus:ring-ring w-full sm:w-[180px]"
              value={sortOption}
              onChange={(e) => updateFilters("sort", e.target.value)}
            >
              <option value="name_asc">A-Z (Ordem Alfabética)</option>
              <option value="name_desc">Z-A (Inverso)</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
            </select>
          </div>
          <div className="flex flex-row justify-between xl:justify-end items-center gap-4 w-full xl:w-auto">
            <Sheet>
              <SheetTrigger className="md:hidden flex items-center justify-center gap-2 font-bold shadow-sm border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 rounded-md transition-colors text-sm">
                <Filter className="w-4 h-4" /> Filtros
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[85vw] sm:max-w-[350px] overflow-y-auto px-4 py-6"
              >
                <SheetHeader className="mb-6 text-left">
                  <SheetTitle className="text-2xl font-black">
                    Filtros da Loja
                  </SheetTitle>
                </SheetHeader>
                <Accordion
                  multiple
                  defaultValue={["color", "type", "subtype", "extras", "set"]}
                  className="w-full"
                >
                  <AccordionItem value="color" className="border-b-0 pb-2">
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                      Cores
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge
                          variant={
                            selectedColors.length === 0 ? "default" : "outline"
                          }
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
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                      Tipos
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge
                          variant={
                            selectedTypes.length === 0 ? "default" : "outline"
                          }
                          className="cursor-pointer hover:opacity-80 pb-0.5"
                          onClick={() => toggleType(null)}
                        >
                          Todos
                        </Badge>
                        {types.map((t) => (
                          <Badge
                            key={t}
                            variant={
                              selectedTypes.includes(t) ? "default" : "outline"
                            }
                            className="cursor-pointer hover:opacity-80 pb-0.5"
                            onClick={() => toggleType(t)}
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="subtype" className="border-b-0 pb-2">
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                      Subtipos
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1.5 border-l-2 pl-3 mt-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        <Input
                          placeholder="Buscar subtipo..."
                          value={subtypeSearch}
                          onChange={(e) => setSubtypeSearch(e.target.value)}
                          className="h-8 mb-2 text-xs"
                        />
                        {subtypes
                          .filter((st) =>
                            st
                              .toLowerCase()
                              .includes(subtypeSearch.toLowerCase()),
                          )
                          .map((st) => (
                            <button
                              key={st}
                              className={`text-left w-full py-1 px-2 rounded-md transition-colors flex items-center gap-2 hover:bg-muted/50 ${selectedSubtypes.includes(st) ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                              onClick={() => toggleSubtype(st)}
                            >
                              {selectedSubtypes.includes(st) && (
                                <Check className="h-3 w-3 shrink-0" />
                              )}
                              <span className="text-xs font-medium">{st}</span>
                            </button>
                          ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {extras.length > 0 && (
                    <AccordionItem value="extras" className="border-b-0 pb-2">
                      <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                        Extras
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Badge
                            variant={
                              selectedExtras.length === 0
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer hover:opacity-80 pb-0.5"
                            onClick={() => toggleExtras(null)}
                          >
                            Todos
                          </Badge>
                          {extras.map((ex) => (
                            <Badge
                              key={ex}
                              variant={
                                selectedExtras.includes(ex)
                                  ? "default"
                                  : "outline"
                              }
                              className="cursor-pointer hover:opacity-80 pb-0.5"
                              onClick={() => toggleExtras(ex)}
                            >
                              {ex}
                            </Badge>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="language" className="border-b-0 pb-2">
                    <AccordionTrigger className="text-lg font-bold hover:no-underline py-2">
                      Idiomas
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Badge
                          variant={
                            selectedLanguages.length === 0 ? "default" : "outline"
                          }
                          className="cursor-pointer hover:opacity-80 pb-0.5"
                          onClick={() => toggleLanguage(null)}
                        >
                          Todos
                        </Badge>
                        {languages.map((l) => (
                          <button
                            key={l}
                            onClick={() => toggleLanguage(l)}
                            className="focus:outline-none"
                          >
                            <LanguageBadge
                              language={l}
                              showCode={true}
                              className={cn(
                                "cursor-pointer transition-all hover:scale-105",
                                selectedLanguages.includes(l)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-white hover:bg-muted"
                              )}
                            />
                          </button>
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
                                  selectedSet === s
                                    ? "text-primary font-bold"
                                    : ""
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
                  selectedSubtypes.length > 0 ||
                  selectedExtras.length > 0 ||
                  selectedLanguages.length > 0 ||
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
              </SheetContent>
            </Sheet>

            <span className="text-sm font-medium bg-muted px-3 py-1 rounded-full text-muted-foreground">
              {totalItems} {totalItems === 1 ? "card" : "cards"}
              {totalPages > 1 && (
                <>
                  {" "}
                  · Página {currentPage} de {totalPages}
                </>
              )}
            </span>
          </div>
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
            {(selectedColors.length > 0 ||
              selectedTypes.length > 0 ||
              selectedSubtypes.length > 0 ||
              selectedExtras.length > 0 ||
              selectedLanguages.length > 0 ||
              selectedSet) && (
                <Button onClick={clearFilters}>Limpar Todos os Filtros</Button>
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
                        <div className="relative h-full w-full group/image overflow-hidden">
                          {!imageLoaded[item.id] && (
                            <Skeleton className="absolute inset-0 z-0 bg-muted-foreground/10 animate-pulse" />
                          )}
                          <Image
                            src={
                              flippedCards[item.id] &&
                                item.cardTemplate.backImageUrl
                                ? item.cardTemplate.backImageUrl
                                : item.cardTemplate.imageUrl
                            }
                            alt={item.cardTemplate.name}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            className={`object-cover w-full h-full transition-all duration-500 group-hover/image:scale-110 ${imageLoaded[item.id] ? "opacity-100 z-10" : "opacity-0"}`}
                            loading="lazy"
                            onLoad={() =>
                              setImageLoaded((prev) => ({
                                ...prev,
                                [item.id]: true,
                              }))
                            }
                          />
                          
                          {/* Premium Overlay on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 z-20" />

                          <QuickAddButton item={{
                            inventoryId: item.id,
                            name: item.cardTemplate.name,
                            set: item.cardTemplate.set,
                            imageUrl: item.cardTemplate.imageUrl,
                            price: item.price,
                            maxStock: item.quantity
                          }} />

                          {item.cardTemplate.backImageUrl && (
                            <button
                              onClick={() =>
                                setFlippedCards((prev) => ({
                                  ...prev,
                                  [item.id]: !prev[item.id],
                                }))
                              }
                              className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-all duration-200 z-30 opacity-0 group-hover:opacity-100 shadow-lg backdrop-blur-sm"
                              title={
                                flippedCards[item.id]
                                  ? "Ver frente"
                                  : "Ver verso"
                              }
                              aria-label={
                                flippedCards[item.id]
                                  ? "Ver frente do card"
                                  : "Ver verso do card"
                              }
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 text-xs font-medium space-y-2">
                          <div className="w-12 h-16 border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center">
                            ?
                          </div>
                          <span>Sem Imagem</span>
                        </div>
                      )}
                      {item.cardTemplate?.metadata?.foil && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-100 via-amber-400 to-yellow-100 text-black text-[9px] font-black px-2 py-0.5 rounded shadow-lg z-30 animate-pulse border border-amber-200">
                          FOIL
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-1.5 flex-1 relative z-10">
                      <h3
                        className="font-bold text-sm leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors"
                        title={item.cardTemplate?.name}
                      >
                        {item.cardTemplate?.name?.includes(" // ") ? (
                          <>
                            <span className="line-clamp-1">
                              {item.cardTemplate.name.split(" // ")[0]}
                            </span>
                            <span className="block text-[10px] font-medium text-muted-foreground mt-0.5 line-clamp-1">
                              {item.cardTemplate.name.split(" // ")[1]}
                            </span>
                          </>
                        ) : (
                          <span className="line-clamp-2">
                            {item.cardTemplate?.name}
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center flex-wrap gap-1 mt-auto">
                        <span
                          className="text-[10px] font-semibold px-1 py-0.5 bg-muted/50 rounded border border-muted truncate max-w-[100px] flex items-center justify-center cursor-default"
                          title={
                            (item.cardTemplate?.metadata as unknown as Record<string, string>)?.set_name ||
                            item.cardTemplate?.set ||
                            ""
                          }
                        >
                          <SetBadge
                            setCode={item.cardTemplate?.set || ""}
                            className="gap-1 shadow-none"
                            iconClassName="h-3 w-3"
                            textClassName="text-[10px] font-semibold text-foreground tracking-normal m-0 p-0"
                          />
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            item.condition === 'NM' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            item.condition === 'SP' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-muted/50 text-muted-foreground border-muted'
                          }`}
                          title="Condição"
                        >
                          {item.condition}
                        </span>
                        <LanguageBadge 
                          language={item.language} 
                          className="bg-muted/50 border-muted" 
                        />
                        {item.extras &&
                          item.extras.length > 0 &&
                          item.extras.map((ex) => (
                            <span
                              key={ex}
                              className="text-[10px] font-bold px-1.5 py-0.5 bg-gradient-to-r from-violet-100 to-purple-100 text-purple-700 rounded border border-purple-200"
                            >
                              {ex}
                            </span>
                          ))}
                      </div>
                      <div className="mt-2 pt-2 border-t flex flex-col gap-3">
                        <div className="flex flex-col">
                          <span className="font-black text-xl text-primary leading-none mb-1 tracking-tight">
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
                          className={`w-full font-bold text-xs h-9 transition-all duration-300 ease-out hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-md ${addedItems[item.id] ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
                          onClick={() => handleAddToCart(item)}
                          aria-label={
                            addedItems[item.id]
                              ? `${item.cardTemplate?.name} adicionado ao carrinho`
                              : `Adicionar ${item.cardTemplate?.name} ao carrinho`
                          }
                        >
                          {addedItems[item.id] ? (
                            <span className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
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
    </div>
  );
}
