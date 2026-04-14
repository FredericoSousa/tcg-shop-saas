"use client";

import { useState } from "react";
import { ProductSearch } from "./product-search";
import { CartPanel } from "./cart-panel";
import { CustomerSelector, CustomerType } from "./customer-selector";
import { toast } from "sonner";
import { PaymentDialog } from "../orders/payment-dialog";
import { Loader2 } from "lucide-react";

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
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderFriendlyId, setActiveOrderFriendlyId] = useState<string | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Fetch in-progress order when customer is selected
  const fetchInProgressOrder = async (customerId: string) => {
    setIsLoadingOrder(true);
    try {
      const response = await fetch(`/api/admin/pos/order-in-progress?customerId=${customerId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setCart(result.data.items);
        setActiveOrderId(result.data.id);
        setActiveOrderFriendlyId(result.data.friendlyId);
      } else {
        setCart([]);
        setActiveOrderId(null);
        setActiveOrderFriendlyId(null);
      }
    } catch {
      console.error("Error fetching order");
      toast.error("Erro ao carregar pedido em andamento");
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleSelectCustomer = (customer: CustomerType | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      fetchInProgressOrder(customer.id);
    } else {
      setCart([]);
      setActiveOrderId(null);
      setActiveOrderFriendlyId(null);
    }
  };

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

  const handleOpenFinalize = () => {
    if (!selectedCustomer || subtotal <= 0) return;
    
    // First, save current changes if any
    handleCheckout().then(() => {
      setIsPaymentDialogOpen(true);
    });
  };

  const handleFinalizeSuccess = () => {
    setCart([]);
    setSelectedCustomer(null);
    setActiveOrderId(null);
    setActiveOrderFriendlyId(null);
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
        toast.success(`Pedido #${result.data.friendlyId} atualizado!`);
        // Refresh items from server to ensure sync
        fetchInProgressOrder(selectedCustomer.id);
      } else {
        toast.error(result.message || "Erro ao processar venda");
      }
    } catch {
      console.error("Checkout error");
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
        {!selectedCustomer ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-xl bg-background/50">
             <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Loader2 className="h-8 w-8 text-primary animate-pulse" />
             </div>
             <h3 className="text-xl font-bold mb-2">Selecione um Cliente Primeiro</h3>
             <p className="text-muted-foreground max-w-xs mb-6">Para iniciar uma venda ou carregar uma comanda, você precisa selecionar um cliente abaixo.</p>
             <div className="w-[300px]">
                <CustomerSelector 
                  selectedCustomer={selectedCustomer}
                  onSelect={handleSelectCustomer}
                />
             </div>
          </div>
        ) : isLoadingOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm font-medium">Carregando comanda...</p>
          </div>
        ) : (
          <ProductSearch onSelect={addToCart} />
        )}
      </div>

      {/* Right Column: Cart & Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col p-4 bg-background">
        <h2 className="text-lg font-semibold mb-4">Carrinho / Checkout</h2>
        <CartPanel
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onCheckout={handleCheckout}
          onFinalize={handleOpenFinalize}
          isSubmitting={isSubmitting}
          activeOrderId={activeOrderId}
          activeOrderFriendlyId={activeOrderFriendlyId}
        />
      </div>

      {selectedCustomer && activeOrderId && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          orderId={activeOrderId}
          customerId={selectedCustomer.id}
          totalAmount={subtotal}
          onSuccess={handleFinalizeSuccess}
          friendlyId={activeOrderFriendlyId}
        />
      )}
    </div>
  );
}
