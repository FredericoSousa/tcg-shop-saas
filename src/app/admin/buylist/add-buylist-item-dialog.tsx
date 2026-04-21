"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Plus, Search } from "lucide-react";
import { feedback } from "@/lib/utils/feedback";
import { ScryfallCard } from "@/lib/types/scryfall";
import { Skeleton } from "@/components/ui/skeleton";
import { Feedback } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import { ScryfallService } from "@/lib/api/services/scryfall.service";
import { BuylistService } from "@/lib/api/services/buylist.service";
import { MaskedInput } from "@/components/ui/masked-input";
import { parseCurrency } from "@/lib/utils/format";
import { ModalLayout } from "@/components/ui/modal-layout";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function AddBuylistItemDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const router = useRouter();

  const handleSearch = async () => {
    if (!query) return;
    setIsSearching(true);
    setHasSearched(true);
    try {
      const result = await ScryfallService.search(query);
      if (result.success && result.data) {
        setResults(result.data as ScryfallCard[]);
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
          priceCash: parseCurrency(formData.get("priceCash") as string),
          priceCredit: parseCurrency(formData.get("priceCredit") as string),
        };

        const result = await BuylistService.saveItem(body);

        if (!result.success) {
          throw new Error(result.message || "Erro ao salvar o item na buylist");
        }

        feedback.success("Item adicionado à lista de compra!");
        setOpen(false);
        reset();
        router.refresh();
      } catch (error) {
        feedback.apiError(error, "Erro ao salvar o item");
      }
    });
  };

  const reset = () => {
    setQuery("");
    setResults([]);
    setSelectedCardId("");
    setHasSearched(false);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 shadow-lg shadow-primary/10"
      >
        <Plus className="h-4 w-4" />
        Novo Item para Compra
      </Button>
      <ModalLayout
        title="Novo Item na Buylist"
        description="Pesquise o card e defina os preços de compra."
        containerClassName="!max-w-3xl !w-[95vw]"
        className="p-6 space-y-6"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 px-6 rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              form="add-buylist-item-form"
              type="submit"
              disabled={!selectedCardId || isPending}
              className="gap-2 px-8 h-11 rounded-xl font-bold"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span>Salvar na Lista</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Buscar Card
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ex: Black Lotus..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-11 rounded-xl bg-muted/30"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || !query}
                className="h-11 w-28 rounded-xl font-bold"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
          </div>

          <form id="add-buylist-item-form" action={handleSubmit} className="flex flex-col gap-6">
            <div className="min-h-[100px] border border-dashed rounded-2xl bg-muted/5 overflow-hidden flex flex-col">
              {isSearching ? (
                <div className="p-4 space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-3 border rounded-xl animate-pulse">
                      <Skeleton className="w-10 h-14 rounded-md" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !hasSearched ? (
                <Feedback type="search" description="Pesquise uma carta para começar." className="flex-1" />
              ) : results.length === 0 ? (
                <Feedback type="empty" description="Nenhum card encontrado." className="flex-1" />
              ) : (
                <div className={cn("max-h-60 overflow-y-auto p-4 grid gap-2 custom-scrollbar", selectedCardId && "max-h-32")}>
                  {results
                    .filter(card => !selectedCardId || card.id === selectedCardId)
                    .map((card) => {
                      const imageUrl = card.image_uris?.small || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "";
                      const isSelected = selectedCardId === card.id;

                      return (
                        <label
                          key={card.id}
                          className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? "bg-primary/10 border-primary" : "border-transparent hover:bg-muted/30"}`}
                        >
                          <input type="radio" name="scryfallId" value={card.id} className="sr-only" checked={isSelected} onChange={() => setSelectedCardId(card.id)} required />
                          <div className="w-10 h-14 relative bg-muted rounded-md shrink-0 overflow-hidden border">
                            {imageUrl && <Image src={imageUrl} alt={card.name} className="object-cover" fill />}
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-bold text-sm truncate">{card.name}</span>
                            <span className="text-2xs font-medium text-muted-foreground uppercase">{card.set_name} ({card.set})</span>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </label>
                      );
                    })}
                </div>
              )}
            </div>

            {selectedCardId && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label htmlFor="priceCash" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Preço Dinheiro
                  </label>
                  <MaskedInput id="priceCash" mask="currency" name="priceCash" required placeholder="R$ 0,00" className="h-11 rounded-xl font-mono" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="priceCredit" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Preço Crédito
                  </label>
                  <MaskedInput id="priceCredit" mask="currency" name="priceCredit" required placeholder="R$ 0,00" className="h-11 rounded-xl font-mono" />
                </div>
              </div>
            )}
          </form>
        </div>
      </ModalLayout>
    </Dialog>
  );
}
