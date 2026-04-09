"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Sparkles, Search, XCircle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ScryfallCard } from "@/lib/types/scryfall";
import { LanguageBadge } from "@/components/ui/language-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Feedback } from "@/components/ui/feedback";

const VALID_EXTRAS = [
  { value: "FOIL", label: "Foil" },
  { value: "PROMO", label: "Promo" },
  { value: "PRE_RELEASE", label: "Pre-Release" },
  { value: "FNM", label: "FNM" },
  { value: "DCI", label: "DCI" },
  { value: "TEXTLESS", label: "Textless" },
  { value: "SIGNED", label: "Signed" },
  { value: "OVERSIZED", label: "Oversized" },
  { value: "ALTERED", label: "Altered" },
  { value: "FOIL_ETCHED", label: "Foil Etched" },
  { value: "MISPRINT", label: "Misprint" },
  { value: "MISCUT", label: "Miscut" },
];

const CONDITION_LABELS = {
  NM: "Near Mint (NM)",
  SP: "Slightly Played (SP)",
  MP: "Moderately Played (MP)",
  HP: "Heavily Played (HP)",
  D: "Damaged (D)",
};

type Card = ScryfallCard;

export function AddCardDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [conditionState, setConditionState] = useState("NM");
  const [languageState, setLanguageState] = useState("EN");
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await fetch(`/api/scryfall/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const result = await response.json();
      if (result.success && result.data) {
        setResults(result.data as Card[]);
      } else {
        setResults([]);
      }
    } catch {
      toast.error("Erro ao buscar o card.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const body = {
          scryfallId: formData.get("scryfallId") as string,
          price: parseFloat(formData.get("price") as string),
          quantity: parseInt(formData.get("quantity") as string, 10),
          condition: formData.get("condition") as string,
          language: formData.get("language") as string,
          extras: selectedExtras,
        };

        const response = await fetch("/api/inventory/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "Erro ao salvar o card");
        }

        toast.success("Card adicionado ao inventário!");
        setOpen(false);
        setQuery("");
        setResults([]);
        setSelectedCardId("");
        setSelectedExtras([]);
        setHasSearched(false);
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Erro ao salvar o card";
        toast.error(msg);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className="transition-all duration-300 hover:scale-105 active:scale-95 gap-2 shadow-lg shadow-primary/10"
        aria-label="Adicionar novo card ao estoque"
      >
        <Sparkles className="h-4 w-4" />
        Adicionar Card
      </Button>
      <DialogContent className="!max-w-4xl !w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-zinc-200/60 dark:border-zinc-800/60 shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/5">
          <DialogTitle className="text-2xl font-black tracking-tight">
            Adicionar ao Estoque
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-blue-500" />
            Busque, selecione a edição e configure as propriedades do card.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Buscador */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Buscar Card na Base Global
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: Black Lotus, Sheoldred's Edict, Lightning Bolt..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  autoFocus
                  className="pl-10 h-12 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 bg-muted/30 border-zinc-200/50 dark:border-zinc-800/50 rounded-xl"
                  aria-label="Campo de busca de cards"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !query}
                className="h-12 w-32 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 rounded-xl font-bold"
                aria-label="Buscar cards na Scryfall"
              >
                {isSearching ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Buscar"
                )}
              </Button>
            </div>
          </div>

          <form action={handleSubmit} className="flex flex-col gap-8">
            {/* Resultados da Busca */}
            <div className="flex flex-col gap-3">
               <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center justify-between">
                <span>Edições Disponíveis</span>
                {results.length > 0 && <span className="text-primary">{results.length} resultados</span>}
              </label>
              
              <div className="min-h-[200px] border border-dashed rounded-2xl bg-muted/5 overflow-hidden flex flex-col">
                {isSearching ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-3 border rounded-xl animate-pulse">
                        <Skeleton className="w-12 h-16 rounded-md" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : !hasSearched ? (
                  <Feedback 
                    type="search" 
                    description="Digite o nome de uma carta acima para começar a busca global." 
                    className="flex-1"
                  />
                ) : results.length === 0 ? (
                  <Feedback 
                    type="empty" 
                    title="Nenhum card encontrado"
                    description={`Não encontramos resultados para "${query}". Verifique a ortografia ou tente outro termo.`}
                    className="flex-1"
                    icon={<XCircle className="h-10 w-10 text-destructive/40" />}
                  />
                ) : (
                  <div className="max-h-80 overflow-y-auto p-4 grid gap-3 custom-scrollbar">
                    {results.map((card) => {
                      const imageUrl = card.image_uris?.small || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
                      const isSelected = selectedCardId === card.id;
                      
                      return (
                        <label
                          key={card.id}
                          className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden ${
                            isSelected 
                              ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20" 
                              : "border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white/50 dark:bg-zinc-900/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="scryfallId"
                            value={card.id}
                            className="sr-only"
                            checked={isSelected}
                            onChange={() => setSelectedCardId(card.id)}
                            required
                          />
                          <div className="w-14 h-20 relative bg-muted rounded-lg shrink-0 overflow-hidden border border-zinc-200/30 dark:border-zinc-800/30 shadow-sm transition-transform duration-500 group-hover:scale-105">
                            {imageUrl && (
                              <img
                                src={imageUrl}
                                alt={card.name}
                                className="object-cover w-full h-full"
                                loading="lazy"
                              />
                            )}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-base tracking-tight leading-tight mb-0.5 truncate group-hover:text-primary transition-colors">
                              {(card.printed_name as string) || card.name}
                            </span>
                            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 capitalize">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              {card.set_name} · <span className="uppercase text-[10px] font-black">{card.set}</span>
                            </span>
                          </div>
                          {isSelected && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {selectedCardId && (
              <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                {/* Seção de Preço e Quantidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="price"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                    >
                      Preço Unitário (R$)
                    </label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground group-focus-within:text-primary transition-colors">R$</span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        name="price"
                        required
                        placeholder="0,00"
                        min="0"
                        className="pl-10 h-12 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl font-mono tabular-nums font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="quantity"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                    >
                      Quantidade
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      name="quantity"
                      required
                      defaultValue="1"
                      min="1"
                      className="h-12 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Seção de Condição e Idioma */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="condition"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                    >
                      Estado de Conservação
                    </label>
                    <Select name="condition" defaultValue="NM" required onValueChange={(val) => setConditionState(val)}>
                      <SelectTrigger
                        id="condition"
                        className="h-12 transition-all duration-300 focus-visible:ring-2 rounded-xl font-medium"
                      >
                        <SelectValue placeholder="Selecione...">
                          {CONDITION_LABELS[conditionState as keyof typeof CONDITION_LABELS] || "Near Mint (NM)"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="NM">Near Mint (NM) · <span className="text-[10px] text-emerald-500 font-bold uppercase">Impecável</span></SelectItem>
                        <SelectItem value="SP">Slightly Played (SP) · <span className="text-[10px] text-blue-500 font-bold uppercase">Sinais leves</span></SelectItem>
                        <SelectItem value="MP">Moderately Played (MP) · <span className="text-[10px] text-amber-500 font-bold uppercase">Sinais visíveis</span></SelectItem>
                        <SelectItem value="HP">Heavily Played (HP) · <span className="text-[10px] text-orange-500 font-bold uppercase">Muito usado</span></SelectItem>
                        <SelectItem value="D">Damaged (D) · <span className="text-[10px] text-destructive font-bold uppercase">Danificado</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="language"
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                    >
                      Idioma Original
                    </label>
                    <Select name="language" defaultValue="EN" required onValueChange={(val) => setLanguageState(val)}>
                      <SelectTrigger
                        id="language"
                        className="h-12 transition-all duration-300 focus-visible:ring-2 rounded-xl font-medium"
                      >
                        <SelectValue placeholder="Selecione...">
                          {languageState === "EN" ? "Inglês (EN)" : languageState === "PT" ? "Português (PT)" : languageState === "JP" ? "Japonês (JP)" : "Inglês (EN)"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="EN"><LanguageBadge language="EN" className="bg-transparent border-0 p-0 shadow-none text-sm font-bold" /></SelectItem>
                        <SelectItem value="PT"><LanguageBadge language="PT" className="bg-transparent border-0 p-0 shadow-none text-sm font-bold" /></SelectItem>
                        <SelectItem value="JP"><LanguageBadge language="JP" className="bg-transparent border-0 p-0 shadow-none text-sm font-bold" /></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Seção de Extras */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Atributos Especiais (Extras)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {VALID_EXTRAS.map((extra) => {
                      const isSelected = selectedExtras.includes(extra.value);
                      return (
                        <label
                          key={extra.value}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                              : "border-zinc-200/50 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 bg-muted/30"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedExtras([...selectedExtras, extra.value]);
                              } else {
                                setSelectedExtras(selectedExtras.filter((e) => e !== extra.value));
                              }
                            }}
                            className="w-4 h-4 accent-primary cursor-pointer rounded-md"
                          />
                          <span className={`text-[10px] font-black uppercase tracking-tight truncate ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                            {extra.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t mt-4 sticky bottom-0 bg-white dark:bg-zinc-950 pb-2 z-10 transition-colors">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  setResults([]);
                  setSelectedCardId("");
                  setSelectedExtras([]);
                  setHasSearched(false);
                }}
                className="transition-all duration-300 hover:bg-muted h-12 px-6 rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!selectedCardId || isPending}
                className="transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 gap-2 px-8 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Salvar no Estoque</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
