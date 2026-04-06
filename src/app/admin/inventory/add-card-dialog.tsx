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
import { Loader2, Check, Sparkles } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const response = await fetch(`/api/scryfall/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const cards = await response.json();
      setResults(cards as Card[]);
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

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Erro ao salvar o card");
        }

        toast.success("Card adicionado ao inventário!");
        setOpen(false);
        setQuery("");
        setResults([]);
        setSelectedCardId("");
        setSelectedExtras([]);
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
        className="transition-all duration-200 hover:scale-105 active:scale-95 gap-2"
        aria-label="Adicionar novo card ao estoque"
      >
        <Sparkles className="h-4 w-4" />
        Adicionar Card
      </Button>
      <DialogContent className="!max-w-full !w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">
            Adicionar Card ao Estoque
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Busque, selecione e configure seu card
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4">
          {/* Buscador */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              Buscar Card
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Black Lotus, Sheoldred's Edict, Lightning Bolt..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                autoFocus
                className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label="Campo de busca de cards"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !query}
                className="w-28 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label="Buscar cards na Scryfall"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="sr-only">Buscando...</span>
                  </>
                ) : (
                  "Buscar"
                )}
              </Button>
            </div>
          </div>

          <form action={handleSubmit} className="flex flex-col gap-6">
            {/* Seleção de Edição */}
            {results.length > 0 && (
              <fieldset className="flex flex-col gap-3 border border-border rounded-lg p-4 bg-gradient-to-b from-muted/40 to-muted/20">
                <legend className="text-sm font-semibold text-foreground">
                  Edições Encontradas ({results.length})
                </legend>
                <div className="max-h-72 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {results.map((card) => {
                    const cardObj = card;
                    const imageUris = cardObj.image_uris;
                    const imageUrl =
                      imageUris?.small ||
                      imageUris?.normal ||
                      cardObj.card_faces?.[0]?.image_uris?.normal ||
                      "";
                    return (
                      <label
                        key={card.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-150 hover:bg-muted/60 border-2 ${selectedCardId === card.id ? "bg-primary/15 border-primary shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                      >
                        <input
                          type="radio"
                          name="scryfallId"
                          value={card.id}
                          className="w-4 h-4 accent-primary cursor-pointer"
                          checked={selectedCardId === card.id}
                          onChange={() => setSelectedCardId(card.id)}
                          required
                          aria-label={`Selecionar ${card.name} de ${card.set_name}`}
                        />
                        <div className="w-12 h-16 relative bg-muted rounded shrink-0 overflow-hidden border border-muted-foreground/20">
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={card.name}
                              className="object-cover rounded w-full h-full hover:scale-110 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="font-semibold text-sm leading-tight">
                            {String(card.printed_name || card.name || "")}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {card.set_name} ({card.set.toUpperCase()})
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {selectedCardId && (
              <>
                {/* Seção de Preço e Quantidade */}
                <fieldset className="grid grid-cols-2 gap-4">
                  <legend className="sr-only">Preço e Quantidade</legend>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="price"
                      className="text-sm font-semibold text-foreground"
                    >
                      Preço (R$) <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      name="price"
                      required
                      placeholder="0.00"
                      min="0"
                      className="transition-all duration-200 focus-visible:ring-2"
                      aria-label="Preço do card"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="quantity"
                      className="text-sm font-semibold text-foreground"
                    >
                      Quantidade <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="quantity"
                      type="number"
                      name="quantity"
                      required
                      defaultValue="1"
                      min="1"
                      className="transition-all duration-200 focus-visible:ring-2"
                      aria-label="Quantidade de cards"
                    />
                  </div>
                </fieldset>

                {/* Seção de Condição e Idioma */}
                <fieldset className="grid grid-cols-2 gap-4">
                  <legend className="sr-only">Condição e Idioma</legend>
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="condition"
                      className="text-sm font-semibold text-foreground"
                    >
                      Condição <span className="text-destructive">*</span>
                    </label>
                    <Select name="condition" defaultValue="NM" required>
                      <SelectTrigger
                        id="condition"
                        className="transition-all duration-200 focus-visible:ring-2"
                        aria-label="Selecionar condição do card"
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NM">Near Mint (NM)</SelectItem>
                        <SelectItem value="SP">
                          Slightly Played (SP)
                        </SelectItem>
                        <SelectItem value="MP">
                          Moderately Played (MP)
                        </SelectItem>
                        <SelectItem value="HP">
                          Heavily Played (HP)
                        </SelectItem>
                        <SelectItem value="D">Damaged (D)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="language"
                      className="text-sm font-semibold text-foreground"
                    >
                      Idioma <span className="text-destructive">*</span>
                    </label>
                    <Select name="language" defaultValue="EN" required>
                      <SelectTrigger
                        id="language"
                        className="transition-all duration-200 focus-visible:ring-2"
                        aria-label="Selecionar idioma do card"
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EN">
                          <LanguageBadge language="EN" className="bg-transparent border-0 p-0 shadow-none" />
                        </SelectItem>
                        <SelectItem value="PT">
                          <LanguageBadge language="PT" className="bg-transparent border-0 p-0 shadow-none" />
                        </SelectItem>
                        <SelectItem value="JP">
                          <LanguageBadge language="JP" className="bg-transparent border-0 p-0 shadow-none" />
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </fieldset>

                {/* Seção de Extras */}
                <fieldset className="flex flex-col gap-3 border border-border rounded-lg p-4 bg-gradient-to-b from-muted/40 to-muted/20">
                  <legend className="text-sm font-semibold text-foreground">
                    Extras (Opcional)
                  </legend>
                  <p className="text-xs text-muted-foreground">
                    Selecione quaisquer características especiais do card
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {VALID_EXTRAS.map((extra) => (
                      <label
                        key={extra.value}
                        className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedExtras.includes(extra.value)
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-transparent bg-muted/50 hover:bg-muted/70"
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(extra.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExtras([
                                ...selectedExtras,
                                extra.value,
                              ]);
                            } else {
                              setSelectedExtras(
                                selectedExtras.filter((e) => e !== extra.value),
                              );
                            }
                          }}
                          className="w-4 h-4 accent-primary cursor-pointer rounded"
                          aria-label={`Selecionar ${extra.label}`}
                        />
                        <span className="text-xs font-medium truncate">
                          {extra.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  setResults([]);
                  setSelectedCardId("");
                  setSelectedExtras([]);
                }}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!selectedCardId || isPending}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 gap-2 px-6"
                aria-label={
                  isPending ? "Salvando card..." : "Salvar card no estoque"
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Salvar no Estoque
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
