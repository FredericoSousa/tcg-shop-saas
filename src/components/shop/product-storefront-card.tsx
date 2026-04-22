"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/store/use-cart";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";

export interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  allowNegativeStock: boolean;
  category?: { name: string } | null;
}

export function ProductStorefrontCard({ product }: { product: StorefrontProduct }) {
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const outOfStock = !product.allowNegativeStock && product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;

    addItem({
      id: product.id,
      type: "product",
      name: product.name,
      set: product.category?.name,
      imageUrl: product.imageUrl,
      price: product.price,
      quantity: 1,
      maxStock: product.allowNegativeStock ? 9999 : product.stock,
    });

    toast.success(`${product.name} adicionado ao carrinho!`, {
      icon: <ShoppingCart className="h-4 w-4" />,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
      className="group flex flex-col bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-square w-full bg-zinc-50 relative overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-zinc-100 animate-pulse" />
            )}
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-zinc-200">
            <ImageIcon className="h-10 w-10" />
            <span className="text-2xs font-bold uppercase tracking-wider">Sem Imagem</span>
          </div>
        )}

        {outOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-zinc-900 text-white text-2xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Sem estoque
            </span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        {product.category && (
          <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">
            {product.category.name}
          </span>
        )}

        <h3 className="font-bold text-zinc-900 text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors" title={product.name}>
          {product.name}
        </h3>

        {product.description && (
          <p className="text-2xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        <div className="mt-auto pt-3 border-t border-zinc-50 flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="font-black text-xl text-zinc-950 tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {!outOfStock && (
              <span className={`text-2xs font-bold ${product.stock > 3 ? "text-muted-foreground" : "text-warning"}`}>
                {product.allowNegativeStock ? "Disponível" : `${product.stock} un.`}
              </span>
            )}
          </div>

          <Button
            size="sm"
            disabled={outOfStock}
            className={`w-full font-bold text-xs h-9 rounded-xl transition-all duration-300 ${
              isAdded
                ? "bg-success hover:bg-success/90 text-success-foreground"
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
                {outOfStock ? "Sem estoque" : "Comprar"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
