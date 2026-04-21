"use client";

import { useState } from "react";
import { BuylistItem } from "@/lib/domain/entities/buylist";
import { useBuylistStore } from "@/lib/store/buylist-store";
import { formatCurrency } from "@/lib/utils/format";
import { SetBadge } from "@/components/ui/set-badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, Minus, ShoppingCart, Check, RotateCcw } from "lucide-react";
import { feedback } from "@/lib/utils/feedback";
import { LANGUAGE_LIST, getLanguageData } from "@/lib/constants/languages";
import { CONDITION_OPTIONS } from "@/lib/constants/conditions";
import { motion } from "framer-motion";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { MTGCardTitle } from "@/components/ui/mtg-card-title";

interface BuylistCardProps {
  item: BuylistItem;
}


export function BuylistCard({ item }: BuylistCardProps) {
  const [condition, setCondition] = useState("NM");
  const [language, setLanguage] = useState("EN");
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
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

    setIsAdded(true);
    feedback.success(`${item.cardTemplate?.name} adicionado à lista de venda!`);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:border-primary/30 transition-shadow duration-300 hover:shadow-lg h-full"
    >
      <div className="aspect-[7/10] w-full bg-zinc-50 relative overflow-hidden flex items-center justify-center">
        {item.cardTemplate?.imageUrl ? (
          <div className="relative h-full w-full overflow-hidden">
            {!isImageLoaded && (
              <Skeleton className="absolute inset-0 z-0 bg-zinc-100 animate-pulse" />
            )}
            <Image
              src={isFlipped && item.cardTemplate.backImageUrl ? item.cardTemplate.backImageUrl : item.cardTemplate.imageUrl}
              alt={item.cardTemplate.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover w-full h-full transition-transform duration-500 group-hover:scale-105 ${isImageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setIsImageLoaded(true)}
            />
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-2">
              <SetBadge 
                setCode={item.cardTemplate?.set || ""} 
                setName={(item.cardTemplate?.metadata as { set_name?: string } | null | undefined)?.set_name}
                className="bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg shadow-sm border-none" 
              />

              {item.cardTemplate.backImageUrl && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsFlipped((prev) => !prev);
                  }}
                  className="bg-white/90 hover:bg-white text-zinc-900 p-1.5 rounded-lg transition-all duration-200 shadow-sm border border-zinc-100 opacity-0 group-hover:opacity-100"
                  title={isFlipped ? "Ver frente" : "Ver verso"}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-200 text-2xs font-bold uppercase tracking-wider space-y-2">
            <div className="w-12 h-16 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center bg-white">
              ?
            </div>
            <span>Sem Imagem</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3 relative z-10">
        <h3 className="font-bold text-zinc-900 text-sm line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors">
          <MTGCardTitle 
            name={item.cardTemplate?.name || ""} 
            mainClassName="group-hover:text-primary transition-colors" 
          />
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-2xs font-bold text-zinc-400 uppercase tracking-tight">Condição</span>
              <Select value={condition} onValueChange={(val) => setCondition(val || "NM")}>
                <SelectTrigger className="h-8 text-2xs font-bold rounded-xl px-2 bg-zinc-50 border-zinc-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs font-medium">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-2xs font-bold text-zinc-400 uppercase tracking-tight">Idioma</span>
              <Select value={language} onValueChange={(val) => setLanguage(val || "EN")}>
                <SelectTrigger className="h-8 text-2xs font-bold rounded-xl px-2 bg-zinc-50 border-zinc-100">
                  <SelectValue>
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
                        <span className="text-xs font-medium">{lang.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 p-1 bg-zinc-50 rounded-xl border border-zinc-100">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-white hover:text-primary transition-colors"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-black tabular-nums text-zinc-900">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-white hover:text-primary transition-colors"
              onClick={() => setQuantity(quantity + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-50 space-y-2">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-2xs text-zinc-400 uppercase font-black tracking-wider">Em Crédito</span>
              <span className="text-sm font-black text-primary tracking-tight">{formatCurrency(item.priceCredit)}</span>
            </div>
            <div className="flex justify-between items-center opacity-70">
              <span className="text-2xs text-zinc-400 uppercase font-black tracking-wider">Em Dinheiro</span>
              <span className="text-xs font-bold text-zinc-600">{formatCurrency(item.priceCash)}</span>
            </div>
          </div>

          <Button
            className={cn(
              "w-full h-10 rounded-xl font-bold text-xs transition-all duration-300 gap-2 shadow-sm",
              isAdded ? "bg-success hover:bg-success/90 text-success-foreground" : "bg-zinc-950 hover:bg-primary text-white"
            )}
            onClick={handleAdd}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4" />
                Adicionado
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Vender
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
