"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethodType } from "@/lib/domain/entities/order";
import { Trash2, Plus, Wallet, Loader2, CreditCard, Banknote, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { ModalLayout } from "@/components/ui/modal-layout";
import { MaskedInput } from "@/components/ui/masked-input";
import { cn } from "@/lib/utils";
import { parseCurrency } from "@/lib/utils/format";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerId: string;
  totalAmount: number;
  onSuccess: () => void;
  friendlyId?: string | null;
  container?: HTMLElement | null;
}

interface PaymentEntry {
  method: PaymentMethodType;
  amount: number;
}

const PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: "CASH", label: "Dinheiro" },
  { value: "CREDIT_CARD", label: "Cartão de Crédito" },
  { value: "DEBIT_CARD", label: "Cartão de Débito" },
  { value: "PIX", label: "PIX" },
  { value: "TRANSFER", label: "Transferência" },
  { value: "STORE_CREDIT", label: "Crédito da Loja" },
  { value: "OTHER", label: "Outro" },
];

export function PaymentDialog({
  isOpen,
  onClose,
  orderId,
  customerId,
  totalAmount,
  onSuccess,
  friendlyId,
  container,
}: PaymentDialogProps) {
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { method: "CASH", amount: totalAmount },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerBalance, setCustomerBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!customerId) return;
    setLoadingBalance(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}`);
      if (!response.ok) throw new Error("Erro ao carregar saldo");
      const result = await response.json();
      if (result.success && result.data) {
        setCustomerBalance(result.data.creditBalance || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingBalance(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (isOpen) {
      fetchBalance();
    }
  }, [isOpen, fetchBalance]);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
  const remaining = totalAmount - totalPaid;

  const addPayment = () => {
    setPayments([...payments, { method: "PIX", amount: remaining > 0 ? remaining : 0 }]);
  };

  const removePayment = (index: number) => {
    const newPayments = [...payments];
    newPayments.splice(index, 1);
    setPayments(newPayments);
  };

  const updatePayment = (index: number, field: keyof PaymentEntry, value: string | number) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleSubmit = async () => {
    if (Math.abs(remaining) > 0.01 && remaining > 0) {
      toast.error(`Valor total pago é inferior ao total do pedido. Falta R$ ${remaining.toFixed(2)}`);
      return;
    }

    // Check if store credit is enough
    const storeCreditPayment = payments.find(p => p.method === "STORE_CREDIT");
    if (storeCreditPayment && customerBalance !== null && storeCreditPayment.amount > customerBalance) {
      toast.error("Saldo de créditos insuficiente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao finalizar pedido");
      }

      toast.success("Pedido finalizado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao finalizar pedido";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <ModalLayout
        title={`Finalizar Pedido ${friendlyId ? `#${friendlyId}` : `#${orderId.slice(-8).toUpperCase()}`}`}
        description="Selecione as formas de pagamento e os respectivos valores para concluir o pedido."
        containerClassName="max-w-md"
        container={container}
        footer={
          <div className="flex flex-col gap-4 w-full">
            <div className="px-1 space-y-2 border-t pt-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-tight text-[10px]">Total Pago</span>
                <span className={cn(
                  "font-black text-base tabular-nums",
                  totalPaid >= totalAmount - 0.01 ? "text-emerald-600" : "text-zinc-600"
                )}>
                  R$ {totalPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium uppercase tracking-tight text-[10px]">Restante</span>
                <span className={cn(
                  "font-black text-base tabular-nums",
                  remaining > 0.01 ? "text-destructive" : "text-emerald-600"
                )}>
                  R$ {Math.max(0, remaining).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-bold rounded-xl h-11"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || remaining > 0.01}
                className="font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/10"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  "Finalizar Pedido"
                )}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 py-4">
          <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/10 rounded-2xl">
            <span className="text-xs font-black uppercase tracking-widest text-primary/70">Total do Pedido</span>
            <span className="text-xl font-black tabular-nums text-primary">R$ {totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-4">
            {payments.map((payment, index) => {
              const methodData = PAYMENT_METHODS.find(m => m.value === payment.method);

              return (
                <div key={index} className="group flex flex-col gap-3 p-4 border border-zinc-200/60 rounded-2xl bg-white/50 hover:bg-white hover:border-zinc-300 transition-all duration-300 shadow-sm">
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest ml-1">Forma</label>
                      <Select
                        onValueChange={(v) => updatePayment(index, "method", v as string)}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-zinc-200/50">
                          <SelectValue placeholder="Selecione">
                            <div className="flex items-center gap-2">
                              {payment.method === 'CASH' && <Banknote className="w-4 h-4 text-emerald-500" />}
                              {payment.method === 'CREDIT_CARD' && <CreditCard className="w-4 h-4 text-blue-500" />}
                              {payment.method === 'PIX' && <Smartphone className="w-4 h-4 text-teal-500" />}
                              {payment.method === 'STORE_CREDIT' && <Wallet className="w-4 h-4 text-amber-500" />}
                              {methodData?.label}
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              <div className="flex items-center gap-2">
                                {m.value === 'CASH' && <Banknote className="w-3.5 h-3.5" />}
                                {m.value === 'CREDIT_CARD' && <CreditCard className="w-3.5 h-3.5" />}
                                {m.value === 'PIX' && <Smartphone className="w-3.5 h-3.5" />}
                                {m.value === 'STORE_CREDIT' && <Wallet className="w-3.5 h-3.5" />}
                                {m.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-32 space-y-2">
                      <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest ml-1">Valor</label>
                      <MaskedInput
                        mask="currency"
                        value={payment.amount.toFixed(2)}
                        onValueChange={(val) => updatePayment(index, "amount", parseCurrency(String(val)))}
                        className="h-11 rounded-xl font-mono tabular-nums font-bold text-base bg-muted/20 border-zinc-200/50"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-11 w-11 flex-shrink-0 hover:bg-destructive/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => removePayment(index)}
                      disabled={payments.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {payment.method === "STORE_CREDIT" && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50/50 border border-amber-100 rounded-xl text-xs animate-in slide-in-from-top-2">
                      <Wallet className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-amber-700 font-medium">Saldo disponível:</span>
                      {loadingBalance ? (
                        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                      ) : (
                        <span className={cn(
                          "font-black text-sm tabular-nums",
                          customerBalance && customerBalance >= payment.amount ? 'text-emerald-600' : 'text-destructive'
                        )}>
                          R$ {customerBalance?.toFixed(2) || "0.00"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <Button
            variant="ghost"
            className="w-full border-2 border-dashed border-zinc-200 hover:border-primary/30 hover:bg-primary/5 h-12 rounded-2xl text-muted-foreground hover:text-primary font-bold transition-all duration-300"
            onClick={addPayment}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Forma de Pagamento
          </Button>
        </div>
      </ModalLayout>
    </Dialog>
  );
}
