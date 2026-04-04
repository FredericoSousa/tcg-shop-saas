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
import { Loader2, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchScryfallServer } from "@/app/actions/scryfall";
import { addInventoryItem } from "@/app/actions/inventory";
import { toast } from "sonner";
import type { ScryfallCard } from "@scryfall/api-types";

type Card = ScryfallCard.Any;

export function AddCardDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Card[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    try {
      const cards = await searchScryfallServer(query);
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
        await addInventoryItem(formData);
        toast.success("Card adicionado ao inventário!");
        setOpen(false);
        setQuery("");
        setResults([]);
        setSelectedCardId("");
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
        className="transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Adicionar novo card ao estoque"
      >
        Adicionar Card
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar Card ao Estoque</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder="Nome do card (ex: Black Lotus)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
              className="transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Campo de busca de cards"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-24 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
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

          <form action={handleSubmit} className="flex flex-col gap-4">
            {results.length > 0 && (
              <fieldset className="flex flex-col gap-2 border border-border rounded-lg p-4 bg-muted/30">
                <legend className="text-sm font-semibold text-foreground mb-2">
                  Selecione a Edição
                </legend>
                <div className="max-h-64 overflow-y-auto space-y-2 p-1">
                  {results.map((card) => {
                    const cardObj = card as Record<string, unknown>;
                    const imageUris = cardObj.image_uris as
                      | Record<string, string>
                      | undefined;
                    const imageUrl =
                      imageUris?.small ||
                      imageUris?.normal ||
                      (cardObj as any).card_faces[0].image_uris.normal ||
                      "";
                    return (
                      <label
                        key={card.id}
                        className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all duration-150 hover:bg-muted/80 ${selectedCardId === card.id ? "bg-primary/10 border-2 border-primary shadow-sm" : "border border-muted"}`}
                      >
                        <input
                          type="radio"
                          name="scryfallId"
                          value={card.id}
                          className="w-4 h-4 accent-primary"
                          checked={selectedCardId === card.id}
                          onChange={() => setSelectedCardId(card.id)}
                          required
                          aria-label={`Selecionar ${card.name} de ${card.set_name}`}
                        />
                        <div className="w-12 h-16 relative bg-muted rounded shrink-0">
                          {imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={imageUrl}
                              alt={card.name}
                              className="object-cover rounded w-full h-full"
                            />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {(card as any).printed_name ?? card.name}
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
              <fieldset className="grid grid-cols-2 gap-4 border border-border rounded-lg p-4 bg-muted/20">
                <legend className="sr-only">Detalhes do card</legend>
                <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label htmlFor="price" className="text-sm font-medium">
                    Preço (R$)
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
                <div className="flex flex-col gap-2 col-span-2 sm:col-span-1">
                  <label htmlFor="quantity" className="text-sm font-medium">
                    Quantidade
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

                <div className="flex flex-col gap-2">
                  <label htmlFor="condition" className="text-sm font-medium">
                    Condição
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
                      <SelectItem value="SP">Slightly Played (SP)</SelectItem>
                      <SelectItem value="MP">Moderately Played (MP)</SelectItem>
                      <SelectItem value="HP">Heavily Played (HP)</SelectItem>
                      <SelectItem value="D">Damaged (D)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="language" className="text-sm font-medium">
                    Idioma
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
                      <SelectItem value="EN">Inglês (EN)</SelectItem>
                      <SelectItem value="PT">Português (PT)</SelectItem>
                      <SelectItem value="JP">Japonês (JP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </fieldset>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!selectedCardId || isPending}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 gap-2"
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
                    <Check className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
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
