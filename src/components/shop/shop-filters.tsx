"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { SetBadge } from "@/components/ui/set-badge";
import { LanguageBadge } from "@/components/ui/language-badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Image from "next/image";

interface ShopFiltersProps {
  colors: string[];
  types: string[];
  subtypes: string[];
  extras: string[];
  sets: string[];
  languages: string[];
  selectedColors: string[];
  selectedTypes: string[];
  selectedSubtypes: string[];
  selectedExtras: string[];
  selectedLanguages: string[];
  selectedSet: string | null;
  onToggleColor: (c: string | null) => void;
  onToggleType: (t: string | null) => void;
  onToggleSubtype: (st: string | null) => void;
  onToggleExtras: (ex: string | null) => void;
  onToggleLanguage: (l: string | null) => void;
  onSelectSet: (s: string | null) => void;
  onClear: () => void;
}

export function ShopFilters({
  colors,
  types,
  subtypes,
  extras,
  sets,
  languages,
  selectedColors,
  selectedTypes,
  selectedSubtypes,
  selectedExtras,
  selectedLanguages,
  selectedSet,
  onToggleColor,
  onToggleType,
  onToggleSubtype,
  onToggleExtras,
  onToggleLanguage,
  onSelectSet,
  onClear,
}: ShopFiltersProps) {
  const [setSearch, setSetSearch] = useState("");
  const [subtypeSearch, setSubtypeSearch] = useState("");

  const hasActiveFilters =
    selectedColors.length > 0 ||
    selectedTypes.length > 0 ||
    selectedSubtypes.length > 0 ||
    selectedExtras.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedSet != null;

  return (
    <>
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
                onClick={() => onToggleColor(null)}
              >
                Todas
              </Badge>
              {colors.map((c) => (
                <button
                  key={c}
                  title={c}
                  className={`h-8 w-8 rounded-full transition-all flex items-center justify-center overflow-hidden bg-white/20 border border-muted-foreground/20 ${
                    selectedColors.includes(c)
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105"
                  }`}
                  onClick={() => onToggleColor(c)}
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
                onClick={() => onToggleType(null)}
              >
                Todos
              </Badge>
              {types.map((t) => (
                <Badge
                  key={t}
                  variant={selectedTypes.includes(t) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => onToggleType(t)}
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
                    className={`text-left w-full py-1 px-2 rounded-md transition-colors flex items-center gap-2 hover:bg-muted/50 ${
                      selectedSubtypes.includes(st)
                        ? "bg-muted text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onToggleSubtype(st)}
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
                  variant={selectedExtras.length === 0 ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5"
                  onClick={() => onToggleExtras(null)}
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
                    onClick={() => onToggleExtras(ex)}
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
                onClick={() => onToggleLanguage(null)}
              >
                Todos
              </Badge>
              {languages.map((l) => (
                <button
                  key={l}
                  onClick={() => onToggleLanguage(l)}
                  className="focus:outline-none"
                >
                  <LanguageBadge
                    language={l}
                    showCode={true}
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105",
                      selectedLanguages.includes(l)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-white hover:bg-muted",
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
                className={`text-left w-full py-1.5 px-2 rounded-md transition-colors flex items-center hover:bg-muted/50 ${
                  selectedSet === null
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => onSelectSet(null)}
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
                    className={`text-left w-full py-1 px-2 rounded-md transition-colors flex items-center hover:bg-muted/50 ${
                      selectedSet === s
                        ? "bg-muted text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onSelectSet(s)}
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

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4 text-xs text-muted-foreground"
          onClick={onClear}
        >
          Limpar Filtros
        </Button>
      )}
    </>
  );
}
