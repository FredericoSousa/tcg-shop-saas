"use client";

import { useState, useEffect, useRef } from "react";
import { ProductSearch } from "./product-search";
import { CartPanel } from "./cart-panel";
import { CustomerSelector, CustomerType } from "./customer-selector";
import { toast } from "sonner";
import { PaymentDialog } from "../orders/payment-dialog";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingItems, setExistingItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrderFriendlyId, setActiveOrderFriendlyId] = useState<string | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const existingTotal = existingItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = cartTotal + existingTotal;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Erro ao ativar tela cheia: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fetch in-progress order when customer is selected
  const fetchInProgressOrder = async (customerId: string) => {
    setIsLoadingOrder(true);
    try {
      const response = await fetch(`/api/admin/pos/order-in-progress?customerId=${customerId}`);
      const result = await response.json();
      if (result.success && result.data) {
        setExistingItems(result.data.items);
        setActiveOrderId(result.data.id);
        setActiveOrderFriendlyId(result.data.friendlyId);
      } else {
        setExistingItems([]);
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
    setCart([]); // Importante: limpar carrinho local ao trocar de cliente
    if (customer) {
      fetchInProgressOrder(customer.id);
    } else {
      setExistingItems([]);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F9 - Finalize
      if (e.key === "F9" && selectedCustomer && subtotal > 0 && !isSubmitting) {
        e.preventDefault();
        handleOpenFinalize();
      }

      // F2 - Save/Sync
      if (e.key === "F2" && selectedCustomer && cart.length > 0 && !isSubmitting) {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCustomer, subtotal, isSubmitting, cart.length]);

  const handleOpenFinalize = () => {
    if (!selectedCustomer || subtotal <= 0) return;

    // Se houver itens novos, sincroniza primeiro
    if (cart.length > 0) {
      handleCheckout().then(() => {
        setIsPaymentDialogOpen(true);
      });
    } else {
      setIsPaymentDialogOpen(true);
    }
  };

  const handleFinalizeSuccess = () => {
    setCart([]);
    setExistingItems([]);
    setSelectedCustomer(null);
    setActiveOrderId(null);
    setActiveOrderFriendlyId(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      if (selectedCustomer) fetchInProgressOrder(selectedCustomer.id);
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
        toast.success(`Itens adicionados à comanda!`);
        setCart([]); // LIMPA O CARRINHO LOCAL
        fetchInProgressOrder(selectedCustomer.id); // Recarrega os itens do DB
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
    <div
      ref={containerRef}
      className={`flex flex-col lg:flex-row relative overflow-hidden bg-background border shadow-2xl transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none h-screen w-screen' : 'rounded-2xl min-h-[600px] h-[calc(100vh-13rem)]'}`}
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
            <div className="flex-1 border-r flex flex-col p-6 bg-muted/5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Catálogo</h2>
                  <p className="text-sm text-muted-foreground font-medium">Busque e adicione produtos ao pedido</p>
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
              <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
                <ProductSearch onSelect={addToCart} />
              </div>
            </div>

            {/* Right Column: Cart & Checkout */}
            <div className="w-full lg:w-[480px] flex flex-col min-h-0 bg-background border-l overflow-hidden">
              <div className="p-6 flex flex-col h-full overflow-hidden">
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
                    isSubmitting={isSubmitting}
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
          container={containerRef.current}
        />
      )}
    </div>
  );
}
