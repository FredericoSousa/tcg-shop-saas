"use client";

import { useBuylistStore } from "@/lib/store/buylist-store";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ShoppingBag, Trash2, Plus, Minus, Loader2, SendHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { feedback } from "@/lib/utils/feedback";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerForm, customerSchema, CustomerFormValues } from "@/components/storefront/customer-form";
import Image from "next/image";

export function SellCartDrawer() {
  const { items, removeItem, updateQuantity, getTotalCash, getTotalCredit, clearCart } = useBuylistStore();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phoneNumber: '',
      name: '',
    }
  });

  const totalCash = getTotalCash();
  const totalCredit = getTotalCredit();

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const onSubmit = async (data: CustomerFormValues) => {
    if (items.length === 0) return;

    setLoading(true);
    try {
      const response = await fetch('/api/buylist/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({
            cardTemplateId: i.cardTemplateId,
            quantity: i.quantity,
            condition: i.condition,
            language: i.language,
            priceCash: i.priceCash,
            priceCredit: i.priceCredit
          })),
          customerData: {
            name: data.name === 'CLIENTE_EXISTENTE' ? undefined : data.name,
            phoneNumber: data.phoneNumber.replace(/\D/g, ''),
          }
        })
      });
      const res = await response.json();
      const proposalId = res.data?.id;

      feedback.success("Proposta de venda enviada com sucesso!");
      clearCart();
      setOpen(false);
      form.reset();

      if (proposalId) {
        router.push(`/buylist-proposal/${proposalId}`);
      }
    } catch {
      feedback.error("Erro ao processar sua proposta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button size="lg" className="rounded-full h-14 w-14 shadow-2xl shadow-primary/40 relative">
                <ShoppingBag className="h-6 w-6" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-primary text-2xs font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary shadow-sm animate-in zoom-in duration-300">
                    {items.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Button>
            }
          />
          <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="text-2xl font-black flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-primary" />
                Sua Lista de Venda
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="font-bold text-lg">Sua lista está vazia</h3>
                  <p className="text-sm text-muted-foreground">Busque cartas para adicionar e vender.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={`${item.buylistItemId}-${item.condition}-${item.language}`} className="flex gap-4 group p-3 rounded-2xl border bg-card hover:border-primary/50 transition-colors relative">
                    <div className="h-20 w-14 shrink-0 rounded-md overflow-hidden bg-muted relative">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                      )}
                    </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div>
                          <p className="text-sm font-bold line-clamp-1">{item.name}</p>
                          <p className="text-2xs text-muted-foreground uppercase font-medium tracking-tight">
                            {item.set} | {item.condition} | {item.language}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 border rounded-lg px-2 py-0.5 bg-background">
                            <button
                              onClick={() => updateQuantity(item.buylistItemId, item.condition, item.language, item.quantity - 1)}
                              className="p-1 hover:text-primary transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.buylistItemId, item.condition, item.language, item.quantity + 1)}
                              className="p-1 hover:text-primary transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs font-black text-primary">{formatCurrency(item.priceCredit * item.quantity)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.buylistItemId, item.condition, item.language)}
                        className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-md scale-0 group-hover:scale-100 transition-transform"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <SheetFooter className="p-6 bg-muted/20 border-t flex-col gap-4">
                <div className="w-full space-y-2 mb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-muted-foreground">Dinheiro</span>
                    <span className="font-bold">{formatCurrency(totalCash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-black">Crédito na Loja</span>
                    <span className="font-black text-primary">{formatCurrency(totalCredit)}</span>
                  </div>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3 bg-white p-4 rounded-2xl border shadow-sm">
                  <CustomerForm form={form} disabled={loading} />

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-2xl text-base font-black gap-3 shadow-lg shadow-primary/20 mt-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <SendHorizontal className="h-5 w-5" />
                        Enviar Proposta
                      </>
                    )}
                  </Button>
                </form>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
