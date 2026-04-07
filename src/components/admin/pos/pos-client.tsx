"use client";

import { useState } from "react";
import { ProductSearch } from "./product-search";
import { CartPanel } from "./cart-panel";
import { CustomerType } from "./customer-selector";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
};

export function POSClient() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl,
          price: product.price,
          quantity: 1,
        },
      ];
    });
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("O carrinho está vazio");
      return;
    }

    if (!selectedCustomer) {
      toast.error("Por favor, selecione um cliente");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          customerData: {
            id: selectedCustomer.id,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Itens adicionados à comanda!");
        setCart([]);
        setSelectedCustomer(null);
      } else {
        toast.error(result.error || "Erro ao processar venda");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Erro na comunicação com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[700px]">
      {/* Left Column: Product Search */}
      <div className="flex-1 border-r flex flex-col p-4 bg-muted/20">
        <h2 className="text-lg font-semibold mb-4">Catálogo de Produtos</h2>
        <ProductSearch onSelect={addToCart} />
      </div>

      {/* Right Column: Cart & Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col p-4 bg-background">
        <h2 className="text-lg font-semibold mb-4">Carrinho / Checkout</h2>
        <CartPanel
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          onCheckout={handleCheckout}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
