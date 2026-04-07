"use client";

import { CartItem } from "./pos-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Minus, Plus, CreditCard, User } from "lucide-react";

import { CustomerSelector } from "./customer-selector";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  selectedCustomer: any | null;
  onSelectCustomer: (data: any) => void;
  onCheckout: () => void;
  isSubmitting: boolean;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  selectedCustomer,
  onSelectCustomer,
  onCheckout,
  isSubmitting,
}: CartPanelProps) {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-muted/5">
        <div className="p-3 border-b bg-muted/20 font-medium text-sm flex justify-between items-center">
          <span>Itens no Carrinho</span>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs">
            {items.length} {items.length === 1 ? "item" : "itens"}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2 py-10">
              <Plus className="h-8 w-8 opacity-20" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 p-2 rounded-md bg-background border shadow-sm">
                <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0 border">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold truncate uppercase">{item.name}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium">
                      R$ {Number(item.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="p-1 hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="p-1 hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => onRemove(item.id)}
                        className="text-destructive hover:bg-destructive/10 p-1 rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t bg-muted/20">
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">
              R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <CustomerSelector 
          selectedCustomer={selectedCustomer}
          onSelect={onSelectCustomer}
        />

        <Button 
          className="w-full py-6 text-lg font-bold gap-3 shadow-lg" 
          onClick={onCheckout}
          disabled={isSubmitting || items.length === 0}
        >
          {isSubmitting ? "Processando..." : (
            <>
              <Plus className="h-6 w-6" />
              Adicionar à Comanda
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
