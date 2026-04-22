"use client";

import { useCart, CartItemType } from "@/store/use-cart";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface QuickAddButtonProps {
  item: {
    id: string;
    type: CartItemType;
    name: string;
    set?: string;
    imageUrl: string | null;
    price: number;
    maxStock: number;
  };
}

export function QuickAddButton({ item }: QuickAddButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    addItem({
      id: item.id,
      type: item.type,
      name: item.name,
      set: item.set,
      imageUrl: item.imageUrl,
      price: item.price,
      quantity: 1,
      maxStock: item.maxStock,
    });

    toast.success(`${item.name} adicionado ao carrinho!`, {
      icon: <ShoppingCart className="h-4 w-4" />,
    });

    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <Button
      size="sm"
      className={`absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 h-8 w-8 p-0 rounded-lg shadow-lg bg-primary hover:bg-primary/90 text-white z-20 ${isAdding ? "scale-90" : "scale-100"
        }`}
      onClick={handleAdd}
      title="Adicionar ao carrinho"
    >
      <Plus className={`h-4 w-4 transition-transform duration-300 ${isAdding ? "rotate-90" : "rotate-0"}`} />
    </Button>
  );
}
