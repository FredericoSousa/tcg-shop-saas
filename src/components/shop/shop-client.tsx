"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

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
import { formatCurrency } from "@/lib/utils/format";
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
import { MTGCard, MTGCardItem } from "@/components/shop/mtg-card";
import { LiveSearch } from "@/components/storefront/live-search";

export function ShopClient({
  initialInventory,
  availableFilters,
  pageCount,
  totalItems,
  currentPage,
}: {
  tenantId: string;
  initialInventory: MTGCardItem[];
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

  const [setSearch, setSetSearch] = useState("");
  const [subtypeSearch, setSubtypeSearch] = useState("");

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
              <LiveSearch 
                defaultValue={searchQuery} 
                onSearch={(q) => updateFilters("q", q)} 
                inputClassName="h-9 w-full bg-background shadow-sm border-input" 
                placeholder="Buscar cartas pelo nome..."
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
              {filteredInventory.map((item: MTGCardItem) => (
                <MTGCard key={item.id} item={item} variant="store" />
              ))}
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
