"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Sparkles, Search, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedback } from "@/lib/utils/feedback";
import { ScryfallCard } from "@/lib/types/scryfall";
import { Skeleton } from "@/components/ui/skeleton";
import { Feedback } from "@/components/ui/feedback";
import { LANGUAGE_LIST, getLanguageData } from "@/lib/constants/languages";
import { CONDITION_OPTIONS, CONDITION_LABELS } from "@/lib/constants/conditions";
import { cn } from "@/lib/utils";
import { ScryfallService } from "@/lib/api/services/scryfall.service";
import { InventoryService } from "@/lib/api/services/inventory.service";
import { MaskedInput } from "@/components/ui/masked-input";
import { parseCurrency } from "@/lib/utils/format";
import { ModalLayout } from "@/components/ui/modal-layout";
import Image from "next/image";

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
      const result = await ScryfallService.search(query);
      if (result.success && result.data) {
        setResults(result.data as Card[]);
      } else {
        setResults([]);
      }
    } catch (error) {
      feedback.apiError(error, "Erro ao buscar o card.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        const body = {
          scryfallId: formData.get("scryfallId") as string,
          price: parseCurrency(formData.get("price") as string),
          quantity: parseInt(formData.get("quantity") as string, 10),
          condition: formData.get("condition") as string,
          language: formData.get("language") as string,
          extras: selectedExtras,
          allowNegativeStock: formData.get("allowNegativeStock") === "on",
        };

        const result = await InventoryService.addItem(body);

        if (!result.success) {
          throw new Error(result.message || "Erro ao salvar o card");
        }

        feedback.success("Card adicionado ao inventário!");
        setOpen(false);
        setQuery("");
        setResults([]);
        setSelectedCardId("");
        setSelectedExtras([]);
        setHasSearched(false);
      } catch (error) {
        feedback.apiError(error, "Erro ao salvar o card");
      }
    });
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelectedCardId("");
    setSelectedExtras([]);
    setHasSearched(false);
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
      <ModalLayout
        title="Adicionar ao Estoque"
        description="Busque, selecione a edição e configure as propriedades do card."
        containerClassName="!max-w-4xl !w-[95vw]"
        className="p-6 space-y-8"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="transition-all duration-300 hover:bg-muted h-12 px-6 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              form="add-card-form"
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
        }
      >
        <div className="flex flex-col gap-8">
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
                  className="pl-10 h-12 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 bg-muted/30 border-zinc-200/50 rounded-xl"
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

          <form id="add-card-form" action={handleSubmit} className="flex flex-col gap-8">
            {/* Resultados da Busca */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center justify-between">
                <span>Edições Disponíveis</span>
                <div className="flex items-center gap-3">
                  {results.length > 0 && !selectedCardId && <span className="text-primary">{results.length} resultados</span>}
                  {selectedCardId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] font-black uppercase px-3 bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 rounded-lg transition-all"
                      onClick={() => setSelectedCardId("")}
                    >
                      Trocar Edição
                    </Button>
                  )}
                </div>
              </label>

              <div className="min-h-[100px] border border-dashed rounded-2xl bg-muted/5 overflow-hidden flex flex-col transition-all duration-500">
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
                  <div className={cn(
                    "max-h-80 overflow-y-auto p-4 grid gap-3 custom-scrollbar transition-all duration-500",
                    selectedCardId && "max-h-40"
                  )}>
                    {results
                      .filter(card => !selectedCardId || card.id === selectedCardId)
                      .map((card) => {
                        const imageUrl = card.image_uris?.small || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
                        const isSelected = selectedCardId === card.id;

                        return (
                          <label
                            key={card.id}
                            className={`group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-300 border-2 relative overflow-hidden ${isSelected
                              ? "bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20"
                              : "border-zinc-200/50 hover:border-zinc-300 bg-white/50"
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
                            <div className="w-14 h-20 relative bg-muted rounded-lg shrink-0 overflow-hidden border border-zinc-200/30 shadow-sm transition-transform duration-500 group-hover:scale-105">
                              {imageUrl && (
                                <Image
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
                    <MaskedInput
                      id="price"
                      mask="currency"
                      name="price"
                      required
                      placeholder="R$ 0,00"
                      className="h-12 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl font-mono tabular-nums font-bold"
                    />
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
                    <Select name="condition" defaultValue="NM" required onValueChange={(val) => val && setConditionState(val)}>
                      <SelectTrigger
                        id="condition"
                        className="h-12 transition-all duration-300 focus-visible:ring-2 rounded-xl font-medium"
                      >
                        <SelectValue placeholder="Selecione...">
                          {CONDITION_LABELS[conditionState as keyof typeof CONDITION_LABELS] || "Near Mint (NM)"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CONDITION_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label} · <span className={cn("text-[10px] font-bold uppercase", opt.color)}>{opt.detail}</span>
                          </SelectItem>
                        ))}
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
                    <Select name="language" defaultValue="EN" required onValueChange={(val) => val && setLanguageState(val)}>
                      <SelectTrigger
                        id="language"
                        className="h-12 transition-all duration-300 focus-visible:ring-2 rounded-xl font-medium"
                      >
                        <SelectValue placeholder="Selecione...">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getLanguageData(languageState).flag}</span>
                            <span className="font-bold">{getLanguageData(languageState).label}</span>
                            <span className="text-muted-foreground text-xs">({languageState})</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {LANGUAGE_LIST.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{lang.flag}</span>
                              <span className="font-semibold">{lang.label}</span>
                              <span className="text-muted-foreground text-[10px] uppercase">({lang.code})</span>
                            </div>
                          </SelectItem>
                        ))}
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
                          className={`flex items-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all duration-300 ${isSelected
                            ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                            : "border-zinc-200/50 hover:border-zinc-300 bg-muted/30"
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

            {selectedCardId && (
              <div className="flex items-center space-x-2 py-4 px-2 bg-muted/20 rounded-xl border border-dashed animate-in fade-in duration-700">
                <input
                  type="checkbox"
                  name="allowNegativeStock"
                  id="allowNegativeStock"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm"
                />
                <div className="grid gap-0.5 leading-none">
                  <label
                    htmlFor="allowNegativeStock"
                    className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Permitir estoque negativo
                  </label>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Se ativado, este card poderá ser vendido via PDV mesmo sem estoque físico.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>
      </ModalLayout>
    </Dialog>
  );
}
