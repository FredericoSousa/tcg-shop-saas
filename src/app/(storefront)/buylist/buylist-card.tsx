"use client";

import { useState } from "react";
import { BuylistItem } from "@/lib/domain/entities/buylist";
import { useBuylistStore } from "@/lib/store/buylist-store";
import { formatCurrency } from "@/lib/utils";
import { SetBadge } from "@/components/ui/set-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { feedback } from "@/lib/utils/feedback";
import { LANGUAGE_LIST, getLanguageData } from "@/lib/constants/languages";

interface BuylistCardProps {
  item: BuylistItem;
}

const CONDITION_LABELS = {
  NM: "Near Mint",
  SP: "Slightly Played",
  MP: "Moderately Played",
  HP: "Heavily Played",
  D: "Damaged",
};

export function BuylistCard({ item }: BuylistCardProps) {
  const [condition, setCondition] = useState("NM");
  const [language, setLanguage] = useState("EN");
  const [quantity, setQuantity] = useState(1);
  const addItem = useBuylistStore((state) => state.addItem);

  const handleAdd = () => {
    addItem({
      buylistItemId: item.id,
      cardTemplateId: item.cardTemplateId,
      name: item.cardTemplate?.name || "Card",
      set: item.cardTemplate?.set || "",
      imageUrl: item.cardTemplate?.imageUrl || null,
      condition,
      language,
      quantity,
      priceCash: item.priceCash,
      priceCredit: item.priceCredit,
    });
    feedback.success(`${item.cardTemplate?.name} adicionado à lista de venda!`);
  };

  return (
    <div className="group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <div className="relative aspect-[7/10] overflow-hidden bg-muted">
        {item.cardTemplate?.imageUrl ? (
          <img
            src={item.cardTemplate.imageUrl}
            alt={item.cardTemplate.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Sem imagem</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <SetBadge setCode={item.cardTemplate?.set || ""} className="bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg shadow-sm" />
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        <h3 className="font-bold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
          {item.cardTemplate?.name}
        </h3>

        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-1.5">
            <Select value={condition} onValueChange={(val) => setCondition(val || "NM")}>
              <SelectTrigger className="h-8 text-[11px] font-bold rounded-lg px-2">
                <SelectValue placeholder="Condição" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={language} onValueChange={(val) => setLanguage(val || "EN")}>
              <SelectTrigger className="h-8 text-[11px] font-bold rounded-lg px-2">
                <SelectValue placeholder="Idioma">
                  <div className="flex items-center gap-1.5">
                    <span>{getLanguageData(language).flag}</span>
                    <span>{getLanguageData(language).code}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_LIST.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-1 p-1 bg-muted/30 rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-white"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs font-black tabular-nums">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md hover:bg-white"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="mt-auto space-y-1.5 border-t pt-3">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            <span>Em créditos:</span>
            <span className="text-primary">{formatCurrency(item.priceCredit)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            <span>Em dinheiro:</span>
            <span>{formatCurrency(item.priceCash)}</span>
          </div>
          <Button
            className="w-full h-9 mt-2 rounded-xl text-xs font-bold gap-2 shadow-sm"
            onClick={handleAdd}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Vender
          </Button>
        </div>
      </div>
    </div>
  );
}
