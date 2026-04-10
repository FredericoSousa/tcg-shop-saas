"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethodType } from "@/lib/domain/entities/order";
import { Trash2, Plus, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  customerId: string;
  totalAmount: number;
  onSuccess: () => void;
  friendlyId?: string | null;
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

  const updatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido {friendlyId ? `#${friendlyId}` : `#${orderId.slice(-8).toUpperCase()}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>Total do Pedido:</span>
            <span>R$ {totalAmount.toFixed(2)}</span>
          </div>

          <div className="space-y-3">
            {payments.map((payment, index) => (
              <div key={index} className="flex flex-col gap-2 p-3 border rounded-lg bg-muted/20">
                <div className="flex gap-2 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Forma de Pagamento</label>
                    <Select
                      value={payment.method}
                      onValueChange={(v) => updatePayment(index, "method", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione">
                          {PAYMENT_METHODS.find((m) => m.value === payment.method)?.label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-1">
                    <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Valor (R$)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => updatePayment(index, "amount", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-10 w-10 flex-shrink-0"
                    onClick={() => removePayment(index)}
                    disabled={payments.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {payment.method === "STORE_CREDIT" && (
                  <div className="flex items-center gap-2 text-xs">
                    <Wallet className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">Saldo disponível:</span>
                    {loadingBalance ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <span className={`font-bold ${customerBalance && customerBalance >= payment.amount ? 'text-green-600' : 'text-destructive'}`}>
                        R$ {customerBalance?.toFixed(2) || "0.00"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={addPayment}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Forma de Pagamento
          </Button>

          <div className="border-t pt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Total Pago:</span>
              <span className={totalPaid >= totalAmount - 0.01 ? "text-green-600 font-bold" : ""}>
                R$ {totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Restante:</span>
              <span className={remaining > 0 ? "text-destructive font-bold" : "text-green-600"}>
                R$ {Math.max(0, remaining).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (remaining > 0.01)}>
            {isSubmitting ? "Finalizando..." : "Finalizar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
