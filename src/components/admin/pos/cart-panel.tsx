"use client";

import { CartItem } from "./pos-client";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus, X } from "lucide-react";
import Image from "next/image";

import { CustomerType } from "./customer-selector";

interface CartPanelProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  selectedCustomer: CustomerType | null;
  onSelectCustomer: (customer: CustomerType | null) => void;
  onCheckout: () => void;
  onFinalize: () => void;
  isSubmitting: boolean;
  activeOrderId?: string | null;
  activeOrderFriendlyId?: string | null;
}

export function CartPanel({
  items,
  onUpdateQuantity,
  onRemove,
  selectedCustomer,
  onSelectCustomer,
  onCheckout,
  onFinalize,
  isSubmitting,
  activeOrderFriendlyId,
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
                  {item.imageUrl && (
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name} 
                      width={40}
                      height={40}
                      className="h-full w-full object-cover" 
                    />
                  )}
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
        {selectedCustomer && (
          <div className="p-3 rounded-lg border bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{selectedCustomer.name.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-[150px]">{selectedCustomer.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedCustomer.phoneNumber}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground"
              onClick={() => onSelectCustomer(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline"
            className="w-full py-6 font-semibold" 
            onClick={onCheckout}
            disabled={isSubmitting || items.length === 0 || !selectedCustomer}
          >
            {isSubmitting ? "Salvando..." : "Salvar Comanda"}
          </Button>

          <Button 
            className="w-full py-6 font-bold gap-2 shadow-md bg-green-600 hover:bg-green-700" 
            onClick={onFinalize}
            disabled={isSubmitting || items.length === 0 || !selectedCustomer}
          >
            Finalizar
          </Button>
        </div>

        {activeOrderFriendlyId && (
          <div className="text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              Editando Comanda <span className="text-primary">#{activeOrderFriendlyId}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
