"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductSearch } from "./product-search";
import { CartPanel } from "./cart-panel";
import { CustomerSelector, CustomerType } from "./customer-selector";
import { ProductSearchHandle } from "./product-search";
import { feedback } from "@/lib/utils/feedback";
import { PaymentDialog } from "../orders/payment-dialog";
import { POSBuylistDialog } from "./pos-buylist-dialog";
import { Loader2, UserPlus, ShoppingBag, CreditCard, Search as SearchIcon, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type CartItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  price: number;
  quantity: number;
};

export function POSClient() {
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setContainerElement(node);
    }
  }, []);

  const searchRef = useRef<ProductSearchHandle>(null);
  const queryClient = useQueryClient();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  // React Query for daily summary
  const { data: dailySummary } = useQuery({
    queryKey: ["pos-daily-summary"],
    queryFn: async () => {
      const response = await fetch("/api/admin/pos/daily-summary");
      const result = await response.json();
      return result.success ? result.data : { orderCount: 0, revenue: 0 };
    },
    refetchInterval: 120000, // every 2 mins
  });

  // React Query for in-progress order
  const { data: orderInProgress, isLoading: isLoadingOrder } = useQuery({
    queryKey: ["order-in-progress", selectedCustomer?.id],
    queryFn: async () => {
      if (!selectedCustomer?.id) return null;
      const response = await fetch(`/api/admin/pos/order-in-progress?customerId=${selectedCustomer.id}`);
      const result = await response.json();
      return result.success ? result.data : null;
    },
    enabled: !!selectedCustomer?.id,
  });

  const existingItems = orderInProgress?.items || [];
  const activeOrderId = orderInProgress?.id || null;
  const activeOrderFriendlyId = orderInProgress?.friendlyId || null;

  const cartTotal = cart.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
  const existingTotal = existingItems.reduce((acc: number, item: CartItem) => acc + item.price * item.quantity, 0);
  const subtotal = cartTotal + existingTotal;

  const checkoutMutation = useMutation({
    mutationFn: async ({ items, customerId }: { items: CartItem[], customerId: string }) => {
      const response = await fetch("/api/admin/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          customerData: { id: customerId },
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Erro ao processar venda");
      return result.data;
    },
    onMutate: async ({ items, customerId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["order-in-progress", customerId] });

      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData<{ items: CartItem[] }>(["order-in-progress", customerId]);

      // Optimistically update to the new value
      queryClient.setQueryData(["order-in-progress", customerId], (old: { items: CartItem[] } | undefined) => {
        const existingItems = old?.items || [];
        return {
          ...old,
          items: [...existingItems, ...items],
        };
      });

      // Clear local cart optimistically
      const snapshot = { previousOrder, localCart: [...cart] };
      setCart([]);

      return { snapshot };
    },
    onError: (err, variables, context) => {
      // Rollback
      const snapshot = context?.snapshot as { previousOrder: { items: CartItem[] } | undefined, localCart: CartItem[] } | undefined;
      if (snapshot) {
        queryClient.setQueryData(["order-in-progress", variables.customerId], snapshot.previousOrder);
        setCart(snapshot.localCart);
      }
      feedback.error(err instanceof Error ? err.message : "Erro ao finalizar venda");
    },
    onSuccess: () => {
      feedback.success(`Itens adicionados à comanda!`);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order-in-progress", variables.customerId] });
    },
  });


  const toggleFullscreen = useCallback(() => {
    if (!containerElement) return;
    if (!document.fullscreenElement) {
      containerElement.requestFullscreen().catch((err) => {
        feedback.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, [containerElement]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleSelectCustomer = useCallback((customer: CustomerType | null) => {
    setSelectedCustomer(customer);
    setCart([]);
    if (customer) {
      queryClient.invalidateQueries({ queryKey: ["order-in-progress", customer.id] });
    }
  }, [queryClient]);

  const addToCart = useCallback((product: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    feedback.success(`${product.name} adicionado`, undefined, {
      label: "Desfazer",
      onClick: () => {
        setCart(prev => {
          const item = prev.find(i => i.id === product.id);
          if (item && item.quantity > 1) {
            return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i);
          }
          return prev.filter(i => i.id !== product.id);
        });
      }
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    if (id === "ALL") {
      const itemsToClear = [...cart];
      setCart([]);
      feedback.success("Carrinho limpo", undefined, {
        label: "Desfazer",
        onClick: () => setCart(itemsToClear)
      });
      return;
    }

    let removedItem: CartItem | undefined;

    setCart((prev) => {
      removedItem = prev.find(item => item.id === id);
      return prev.filter((item) => item.id !== id);
    });

    if (removedItem) {
      feedback.success(`${removedItem.name} removido`, undefined, {
        label: "Desfazer",
        onClick: () => {
          if (removedItem) {
            setCart(prev => [...prev, removedItem!]);
          }
        }
      });
    }
  }, [cart]);


  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }, []);

  const handleCheckout = useCallback(async () => {
    if (cart.length === 0) return true;
    if (!selectedCustomer) {
      feedback.error("Por favor, selecione um cliente");
      return false;
    }
    await checkoutMutation.mutateAsync({
      items: cart,
      customerId: selectedCustomer.id
    });
    return true;

  }, [cart, selectedCustomer, checkoutMutation]);

  const handleOpenFinalize = useCallback(async () => {
    if (!selectedCustomer || subtotal <= 0) return;
    if (cart.length > 0) {
      const success = await handleCheckout();
      if (success) setIsPaymentDialogOpen(true);
    } else {
      setIsPaymentDialogOpen(true);
    }
  }, [cart.length, selectedCustomer, subtotal, handleCheckout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        searchRef.current?.focusSearch();
      }
      if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchRef.current?.focusSearch();
      }
      if (e.key === "F9" && selectedCustomer && subtotal > 0 && !checkoutMutation.isPending) {
        e.preventDefault();
        handleOpenFinalize();
      }
      if (e.key === "F2" && selectedCustomer && cart.length > 0 && !checkoutMutation.isPending) {
        e.preventDefault();
        handleCheckout();
      }
      if (e.key === "Escape") {
        if (isPaymentDialogOpen) {
          setIsPaymentDialogOpen(false);
        } else if (selectedCustomer && cart.length === 0 && existingItems.length === 0) {
          setSelectedCustomer(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCustomer, subtotal, checkoutMutation.isPending, cart.length, handleOpenFinalize, handleCheckout, existingItems.length, isPaymentDialogOpen]);

  const handleFinalizeSuccess = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    queryClient.removeQueries({ queryKey: ["order-in-progress"] });
  }, [queryClient]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col lg:flex-row relative overflow-hidden bg-background border shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none h-screen w-screen' : 'rounded-2xl min-h-[500px] h-[calc(100vh-10rem)] md:h-[calc(100vh-13rem)]'}`}
    >

      {/* Fullscreen Toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background border border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-95 shadow-lg group"
        title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
      >
        {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        <span className="absolute right-full mr-2 py-1 px-2 rounded bg-black text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {isFullscreen ? "Sair (Esc)" : "Tela Cheia (F11)"}
        </span>
      </button>

      <AnimatePresence mode="wait">
        {!selectedCustomer ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
          >
            <div className="w-full max-w-md text-center space-y-8">
              <div className="relative inline-block">
                <div className="absolute -inset-4 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-primary/10 p-6 rounded-3xl border border-primary/20 shadow-inner">
                  <UserPlus className="h-12 w-12 text-primary" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Terminal de Vendas</h1>
                <p className="text-muted-foreground text-lg">Selecione um cliente para iniciar uma nova venda ou continuar uma comanda.</p>
              </div>

              <div className="p-6 rounded-2xl border bg-card/80 shadow-lg border-white/10">
                <CustomerSelector
                  selectedCustomer={selectedCustomer}
                  onSelect={handleSelectCustomer}
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { icon: ShoppingBag, label: "Produtos", desc: "Catálogo completo" },
                  { icon: CreditCard, label: "Checkout", desc: "Pagamento ágil" },
                  { icon: SearchIcon, label: "Busca", desc: "Filtros rápidos" }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border bg-muted/30 text-center space-y-1">
                    <item.icon className="h-5 w-5 mx-auto text-primary/60" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : isLoadingOrder ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-12"
          >
            <div className="relative">
              <div className="absolute -inset-8 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <Loader2 className="h-16 w-16 animate-spin text-primary relative" />
            </div>
            <p className="mt-8 text-xl font-medium tracking-tight overflow-hidden whitespace-nowrap border-r-2 border-primary pr-2 animate-pulse">
              Carregando dados da comanda...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="pos-active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className="flex flex-col lg:flex-row w-full h-full"
          >
            {/* Left Column: Product Search */}
            <div className="flex-1 lg:border-r flex flex-col p-4 md:p-6 bg-muted/5 min-h-0">

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Catálogo</h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Selecione os produtos para o carrinho</p>
                  </div>
                  {activeOrderFriendlyId && (
                    <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      <span className="text-xs font-black text-primary uppercase tracking-tighter">Comanda #{activeOrderFriendlyId}</span>
                    </div>
                  )}
                </div>
                {dailySummary && (
                  <div className="hidden sm:flex items-center gap-4 bg-background/50 border rounded-xl px-4 py-2">
                    <POSBuylistDialog />
                    <div className="h-8 w-px bg-border mx-2" />
                    <div className="text-right border-r pr-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vendas Hoje</p>
                      <p className="text-sm font-black">{dailySummary.orderCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Receita Hoje</p>
                      <p className="text-sm font-black text-primary">R$ {Number(dailySummary.revenue).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                <ProductSearch ref={searchRef} onSelect={addToCart} />
              </div>
            </div>


            {/* Right Column: Cart & Checkout */}
            <div className="w-full lg:w-[480px] flex flex-col min-h-0 bg-background lg:border-l overflow-hidden border-t lg:border-t-0">
              <div className="p-4 md:p-6 flex flex-col h-full overflow-hidden">

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold tracking-tight">Resumo</h2>
                  <div className="bg-primary/5 px-3 py-1 rounded-lg border border-primary/10">
                    <span className="text-xs font-bold text-primary">{cart.length} ITENS</span>
                  </div>
                </div>
                <div className="flex-1 min-h-0">
                  <CartPanel
                    items={cart}
                    existingItems={existingItems}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromCart}
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={handleSelectCustomer}
                    subtotal={subtotal}
                    onCheckout={handleCheckout}
                    onFinalize={handleOpenFinalize}
                    isSubmitting={checkoutMutation.isPending}
                    activeOrderId={activeOrderId}

                    activeOrderFriendlyId={activeOrderFriendlyId}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCustomer && activeOrderId && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          orderId={activeOrderId}
          customerId={selectedCustomer.id}
          totalAmount={subtotal}
          onSuccess={handleFinalizeSuccess}
          friendlyId={activeOrderFriendlyId}
          container={containerElement}
        />



      )}
    </div>
  );
}
