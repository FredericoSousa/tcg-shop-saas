"use client";

import { CartItem } from "./pos-client";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, X, ShoppingCart, ArrowRight, Save, Loader2, Receipt } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CustomerType } from "./customer-selector";

interface CartPanelProps {
  items: CartItem[];
  existingItems?: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  selectedCustomer: CustomerType | null;
  onSelectCustomer: (customer: CustomerType | null) => void;
  subtotal: number;
  onCheckout: () => void;
  onFinalize: () => void;
  isSubmitting: boolean;
  activeOrderId?: string | null;
  activeOrderFriendlyId?: string | null;
}

export function CartPanel({
  items,
  existingItems = [],
  onUpdateQuantity,
  onRemove,
  selectedCustomer,
  onSelectCustomer,
  subtotal,
  onCheckout,
  onFinalize,
  isSubmitting,
  activeOrderFriendlyId
}: CartPanelProps) {
  console.log('CartPanel Render:', { items: items.map(i => i.id), existingItems: existingItems.map(i => i.id) });

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 flex flex-col min-h-0 bg-muted/5 border rounded-2xl overflow-hidden shadow-inner">
        <div className="p-4 border-b bg-background flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-widest">Resumo do Pedido</h3>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {/* Existing Items in Command */}
            {existingItems.length > 0 && (
              <div className="space-y-3 opacity-60">
                <div className="flex items-center gap-2 px-1">
                  <Receipt className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Já na Comanda</span>
                </div>
                {existingItems.map((item) => (
                  <motion.div
                    key={`existing-${item.id}`}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-3 p-3 bg-white/40 dark:bg-white/5 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl"
                  >
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="font-bold text-xs truncate leading-tight uppercase tracking-tight">{item.name}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] font-black tabular-nums">R$ {item.price.toFixed(2)} x {item.quantity}</span>
                        <span className="font-black text-[11px] tabular-nums">R$ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <div className="border-b border-dashed my-4 opacity-30" />
              </div>
            )}

            {/* New Items to be Added */}
            {items.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Plus className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Para Adicionar</span>
                </div>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex gap-3 p-3 rounded-xl bg-background border shadow-sm hover:shadow-md transition-all border-white/5"
                  >
                    <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-300 relative">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-bold leading-tight line-clamp-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => onRemove(item.id)}
                          className="text-muted-foreground/30 hover:text-destructive transition-colors p-1 -mr-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-white/5">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 rounded-md"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 rounded-md"
                            onClick={() => onUpdateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm tabular-nums text-primary">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : existingItems.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 text-center space-y-4 py-20">
                <div className="p-6 bg-muted/50 rounded-full border-2 border-dashed">
                  <ShoppingCart className="h-10 w-10 opacity-20" />
                </div>
                <p className="text-sm font-medium">O carrinho está vazio</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t bg-background shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total da Comanda</span>
              <span className="text-3xl font-black tabular-nums tracking-tighter text-foreground">
                R$ {subtotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border bg-primary/5 border-primary/10 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                <span className="text-sm font-black text-primary">{selectedCustomer.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-black truncate max-w-[200px] uppercase tracking-tight">{selectedCustomer.name}</p>
                {activeOrderFriendlyId && <p className="text-[10px] font-bold text-primary tracking-widest">COMANDA #{activeOrderFriendlyId}</p>}
              </div>
            </div>
            <Button
              variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-all"
              onClick={() => onSelectCustomer(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-14 font-black uppercase tracking-widest text-xs border-2 gap-2"
            onClick={onCheckout}
            disabled={isSubmitting || items.length === 0 || !selectedCustomer}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> SALVAR</>}
          </Button>

          <Button
            className="flex-[2] h-14 font-black uppercase tracking-widest text-xs gap-3 shadow-xl"
            onClick={onFinalize}
            disabled={isSubmitting || subtotal === 0 || !selectedCustomer}
          >
            PAGAR
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
