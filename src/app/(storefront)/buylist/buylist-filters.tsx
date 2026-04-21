"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetBadge } from "@/components/ui/set-badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BuylistFiltersProps {
  colors: string[];
  types: string[];
  sets: string[];
  selectedColors: string[];
  selectedTypes: string[];
  selectedSet: string | null;
  onToggleColor: (color: string | null) => void;
  onToggleType: (type: string | null) => void;
  onSelectSet: (set: string | null) => void;
  onClear: () => void;
}

export function BuylistFilters({
  colors,
  types,
  sets,
  selectedColors,
  selectedTypes,
  selectedSet,
  onToggleColor,
  onToggleType,
  onSelectSet,
  onClear,
}: BuylistFiltersProps) {
  const [setSearch, setSetSearch] = useState("");
  const hasFilters = selectedColors.length > 0 || selectedTypes.length > 0 || !!selectedSet;

  return (
    <>
      <Accordion multiple defaultValue={["color", "type", "set"]} className="w-full">
        <AccordionItem value="color" className="border-b-0 pb-2">
          <AccordionTrigger className="text-lg font-bold hover:no-underline py-2 text-foreground">
            Cores
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge
                variant={selectedColors.length === 0 ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 pb-0.5 min-h-[32px]"
                onClick={() => onToggleColor(null)}
              >
                Todas
              </Badge>
              {colors.map((c) => (
                <button
                  key={c}
                  title={c}
                  aria-pressed={selectedColors.includes(c)}
                  className={`h-11 w-11 min-h-[44px] min-w-[44px] rounded-full transition-all flex items-center justify-center overflow-hidden bg-white/20 border border-muted-foreground/20 ${
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
                    className="w-8 h-8 object-contain mix-blend-multiply"
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
                className="cursor-pointer hover:opacity-80 pb-0.5 min-h-[32px]"
                onClick={() => onToggleType(null)}
              >
                Todos
              </Badge>
              {types.map((t) => (
                <Badge
                  key={t}
                  variant={selectedTypes.includes(t) ? "default" : "outline"}
                  className="cursor-pointer hover:opacity-80 pb-0.5 min-h-[32px]"
                  onClick={() => onToggleType(t)}
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
                className="h-9 mb-2 text-xs"
              />
              <button
                className={`text-left w-full py-1.5 px-2 rounded-md transition-colors flex items-center hover:bg-muted/50 min-h-[36px] ${
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
                .filter((s) => s.toLowerCase().includes(setSearch.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    className={`text-left w-full py-1 px-2 rounded-md transition-colors flex items-center hover:bg-muted/50 min-h-[36px] ${
                      selectedSet === s
                        ? "bg-muted text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => onSelectSet(s)}
                  >
                    <SetBadge
                      setCode={s}
                      iconClassName="h-4 w-4 drop-shadow-none opacity-80"
                      textClassName={selectedSet === s ? "text-primary font-bold" : ""}
                    />
                  </button>
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-4 text-xs text-muted-foreground min-h-[44px]"
          onClick={onClear}
        >
          Limpar Filtros
        </Button>
      )}
    </>
  );
}
