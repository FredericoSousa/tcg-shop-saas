"use client";

import { useState } from "react";
import { useCart } from "@/store/use-cart";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { SetBadge } from "@/components/ui/set-badge";
import { LanguageBadge } from "@/components/ui/language-badge";
import { CardCondition } from "@/components/ui/card-condition";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Check, RotateCcw, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ProductDetailClientProps {
  item: {
    id: string;
    price: number;
    quantity: number;
    condition: string;
    language?: string;
    extras?: string[];
    cardTemplate?: {
      name: string;
      set: string;
      imageUrl: string | null;
      backImageUrl?: string | null;
      metadata?: Record<string, unknown> | null;
    } | null;
  };
}

export function ProductDetailClient({ item }: ProductDetailClientProps) {
  const [showBack, setShowBack] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [frontLoaded, setFrontLoaded] = useState(false);
  const [backLoaded, setBackLoaded] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = () => {
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
    setTimeout(() => setIsAdded(false), 2000);
  };

  const hasBackImage = !!item.cardTemplate?.backImageUrl;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
      {/* Visual Section */}
      <div className="space-y-6">
        <div className="relative aspect-[2/3] w-full max-w-md mx-auto group">
          {/* Main Image Card with Flip Logic */}
          <div className="relative w-full h-full perspective-1000">
            <div
              className={cn(
                "relative w-full h-full transition-all duration-700 preserve-3d will-change-transform [transform:translateZ(0)]",
                showBack ? "rotate-y-180" : ""
              )}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900">
                  {item.cardTemplate?.imageUrl ? (
                    <>
                      {!frontLoaded && (
                        <Skeleton className="absolute inset-0 rounded-2xl" />
                      )}
                      <Image
                        src={item.cardTemplate.imageUrl}
                        alt={item.cardTemplate.name || "Product image"}
                        fill
                        priority
                        onLoad={() => setFrontLoaded(true)}
                        className={cn(
                          "object-cover transition-opacity duration-500",
                          frontLoaded ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground font-bold">Sem Imagem</div>
                  )}
                  {/* Foil Effect Overlay (Subtle) */}
                  {item.extras?.includes("Foil") && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none mix-blend-overlay animate-pulse" />
                  )}
                </div>
              </div>

              {/* Back */}
              {hasBackImage && (
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900">
                    {!backLoaded && (
                      <Skeleton className="absolute inset-0 rounded-2xl" />
                    )}
                    <Image
                      src={item.cardTemplate?.backImageUrl || ""}
                      alt={`${item.cardTemplate?.name || "Product"} Back`}
                      fill
                      onLoad={() => setBackLoaded(true)}
                      className={cn(
                        "object-cover transition-opacity duration-500",
                        backLoaded ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Flip Button — inside card bounds for mobile safety */}
            {hasBackImage && (
              <button
                onClick={() => setShowBack(!showBack)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-zinc-950 px-5 py-2.5 rounded-2xl shadow-2xl font-black text-2xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all z-30 border border-zinc-200 min-h-[44px]"
                aria-label={showBack ? "Ver frente da carta" : "Ver verso da carta"}
              >
                <RotateCcw className="w-4 h-4" />
                {showBack ? "Ver Frente" : "Ver Verso"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <SetBadge 
              setCode={item.cardTemplate?.set || ""} 
              setName={item.cardTemplate?.metadata?.set_name as string | undefined}
              className="bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200"
              textClassName="font-black text-zinc-500"
            />
            <CardCondition condition={item.condition} size="md" />
            <LanguageBadge 
              language={item.language || "EN"} 
              className="bg-zinc-100 border-zinc-200 text-zinc-500 h-8 rounded-xl px-3" 
            />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-zinc-950 tracking-tight leading-none italic uppercase">
            {item.cardTemplate?.name}
          </h1>
          
          <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xl">
            {item.cardTemplate?.name} - {item.cardTemplate?.set?.toUpperCase()} - {item.condition} - {item.language?.toUpperCase()} 
            {(item.extras?.length ?? 0) > 0 && ` - ${item.extras?.join(", ")}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl border border-zinc-100 space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Preço Individual</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-primary tracking-tighter italic">
                  {formatCurrency(item.price)}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <span className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest",
                item.quantity > 5 ? "bg-success-muted text-success" :
                item.quantity > 0 ? "bg-warning-muted text-warning" : "bg-destructive-muted text-destructive"
              )}>
                <span className={cn("w-2 h-2 rounded-full animate-pulse",
                  item.quantity > 5 ? "bg-success" :
                  item.quantity > 0 ? "bg-warning" : "bg-destructive"
                )} />
                {item.quantity > 0 ? `${item.quantity} em estoque` : "Fora de estoque"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              disabled={item.quantity <= 0}
              className={cn(
                "w-full h-20 rounded-2xl text-xl font-black uppercase tracking-tighter transition-all duration-500 group",
                isAdded ? "bg-success" : "bg-zinc-950 hover:bg-primary shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.2)] hover:-translate-y-1"
              )}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <span className="flex items-center gap-3 animate-in zoom-in duration-300">
                  <Check className="w-6 h-6" />
                  Card Adicionado!
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 group-hover:-rotate-12 transition-transform" />
                  Adicionar ao Carrinho
                </span>
              )}
            </Button>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <ShieldCheck className="w-5 h-5 text-success" />
                <span className="text-xs font-bold text-zinc-600">Compra Segura</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <Truck className="w-5 h-5 text-info" />
                <span className="text-xs font-bold text-zinc-600">Envio Protegido</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Card Details / Lore */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Detalhes do Colecionador</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1 pb-4 border-b border-zinc-100">
              <span className="text-2xs font-black text-zinc-400 uppercase tracking-widest">Condição</span>
              <CardCondition condition={item.condition} showLabel />
            </div>
            <div className="space-y-1 pb-4 border-b border-zinc-100">
              <span className="text-2xs font-black text-zinc-400 uppercase tracking-widest">Idioma</span>
              <p className="font-bold text-zinc-900">{item.language?.toUpperCase()}</p>
            </div>
            <div className="space-y-1 pb-4 border-b border-zinc-100">
              <span className="text-2xs font-black text-zinc-400 uppercase tracking-widest">Coleção</span>
              <p className="font-bold text-zinc-900">{item.cardTemplate?.set?.toUpperCase()}</p>
            </div>
            {item.extras?.map((ex: string) => (
              <div key={ex} className="space-y-1 pb-4 border-b border-zinc-100">
                <span className="text-2xs font-black text-zinc-400 uppercase tracking-widest">Extra</span>
                <p className="font-bold text-zinc-900">{ex}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
