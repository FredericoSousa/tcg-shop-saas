"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, ShoppingCart, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SetBadge } from "@/components/ui/set-badge";
import { QuickAddButton } from "@/components/shop/quick-add-button";
import { useCart } from "@/store/use-cart";
import { formatCurrency } from "@/lib/utils/format";

export type MTGCardItem = {
  id: string;
  price: number;
  quantity: number;
  condition: string;
  language?: string;
  extras: string[];
  cardTemplate?: {
    name: string;
    set: string;
    imageUrl: string | null;
    backImageUrl?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
  } | null;
};

interface MTGCardProps {
  item: MTGCardItem;
  // Controls whether we show the add to cart / quick add buttons or just a simple display card
  variant?: "store" | "simple";
}

export function MTGCard({ item, variant = "store" }: MTGCardProps) {
  const { addItem } = useCart();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    addItem({
      inventoryId: item.id,
      name: item.cardTemplate?.name || "Card",
      set: item.cardTemplate?.set || "N/A",
      imageUrl: item.cardTemplate?.imageUrl || null,
      price: item.price,
      quantity: 1,
      maxStock: item.quantity,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const isStore = variant === "store";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      className="group relative flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:border-primary/30 transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="aspect-[2/3] w-full bg-zinc-50 relative overflow-hidden flex items-center justify-center">
        {item.cardTemplate?.imageUrl ? (
          <div className="relative h-full w-full group/image overflow-hidden">
            {!isImageLoaded && (
              <Skeleton className="absolute inset-0 z-0 bg-zinc-100 animate-pulse" />
            )}
            <Image
              src={
                isFlipped && item.cardTemplate.backImageUrl
                  ? item.cardTemplate.backImageUrl
                  : item.cardTemplate.imageUrl
              }
              alt={item.cardTemplate.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className={`object-cover w-full h-full transition-transform duration-500 group-hover/image:scale-105 ${isImageLoaded ? "opacity-100 z-10" : "opacity-0"
                }`}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8WQ8AAssBPo78X9IAAAAASUVORK5CYII="
              onLoad={() => setIsImageLoaded(true)}
            />


            {/* Minimal Overlay on Hover */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 z-20" />

            {isStore && (
              <QuickAddButton
                item={{
                  inventoryId: item.id,
                  name: item.cardTemplate.name,
                  set: item.cardTemplate.set,
                  imageUrl: item.cardTemplate.imageUrl,
                  price: item.price,
                  maxStock: item.quantity,
                }}
              />
            )}

            {item.cardTemplate.backImageUrl && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsFlipped((prev) => !prev);
                }}
                className="absolute top-2 left-2 bg-white/90 hover:bg-white text-zinc-900 p-1.5 rounded-lg transition-all duration-200 z-30 opacity-0 group-hover:opacity-100 shadow-md border border-zinc-100"
                title={isFlipped ? "Ver frente" : "Ver verso"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-200 text-[10px] font-bold uppercase tracking-wider space-y-2">
            <div className="w-12 h-16 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center bg-white">
              ?
            </div>
            <span>Sem Imagem</span>
          </div>
        )}

        {item.extras.includes("FOIL") && (
          <div className="absolute top-2 right-2 bg-amber-400 text-zinc-950 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm z-30 uppercase tracking-wider">
            Foil
          </div>
        )}

        {/* Action overlay link for simple variant */}
        {!isStore && (
          <Link href={`/singles/${item.id}`} className="absolute inset-0 z-20" />
        )}
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1 relative z-10">
        <h3
          className="font-bold text-zinc-900 text-sm leading-tight min-h-[2.5rem] group-hover:text-primary transition-colors line-clamp-2"
          title={item.cardTemplate?.name}
        >
          <Link href={`/singles/${item.id}`}>
            {item.cardTemplate?.name?.includes(" // ") ? (
              <>
                {item.cardTemplate.name.split(" // ")[0]}
                <br />
                <span className="text-[10px] text-zinc-500 font-medium">
                  {"// "}{item.cardTemplate.name.split(" // ").slice(1).join(" // ")}
                </span>
              </>
            ) : (
              item.cardTemplate?.name
            )}
          </Link>
        </h3>

        <div className="flex items-center flex-wrap gap-1.5 mt-auto">
          <SetBadge
            setCode={item.cardTemplate?.set || ""}
            setName={item.cardTemplate?.metadata?.set_name}
            className="gap-1 shadow-none bg-zinc-50 border-zinc-100 px-1.5 py-0.5 rounded"
            iconClassName="h-3 w-3"
            textClassName="text-[10px] font-bold text-zinc-400"
          />
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${item.condition === "NM"
                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                : item.condition === "SP"
                  ? "bg-blue-50 text-blue-600 border-blue-100"
                  : "bg-zinc-50 text-zinc-400 border-zinc-100"
              }`}
          >
            {item.condition}
          </span>
        </div>

        <div className="pt-3 border-t border-zinc-50 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className={isStore ? "font-black text-xl text-zinc-950 tracking-tight" : "font-black text-primary text-sm"}>
              {formatCurrency(item.price)}
            </span>
            {isStore && (
              <span
                className={`text-[10px] font-bold ${item.quantity > 3 ? "text-zinc-400" : "text-amber-600"
                  }`}
              >
                {item.quantity} un.
              </span>
            )}
          </div>

          {isStore && (
            <Button
              size="sm"
              className={`w-full font-bold text-xs h-9 rounded-xl transition-all duration-300 ${isAdded
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-zinc-950 hover:bg-primary text-white"
                }`}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Adicionado
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Comprar
                </span>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
