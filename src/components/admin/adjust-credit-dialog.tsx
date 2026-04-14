"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { ModalLayout } from "@/components/ui/modal-layout";
import { MaskedInput } from "@/components/ui/masked-input";

interface AdjustCreditDialogProps {
  customerId: string;
  onSuccess: (newBalance: number) => void;
}

export function AdjustCreditDialog({ customerId, onSuccess }: AdjustCreditDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"add" | "remove">("add");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converte de R$ X,XX para número
    const cleanAmount = amount.replace(/[R$\s]/g, "").replace(".", "").replace(",", ".");
    const numAmount = parseFloat(cleanAmount);

    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, insira um valor válido.");
      return;
    }

    const finalAmount = type === "add" ? numAmount : -numAmount;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/credits/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, description }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao ajustar créditos");
      }

      const result = await response.json();
      toast.success("Créditos ajustados com sucesso!");
      onSuccess(result.newBalance);
      setOpen(false);
      setAmount("");
      setDescription("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" className="gap-2 rounded-xl px-4 h-9 shadow-sm">
          <PlusCircle className="w-4 h-4" />
          Ajustar Créditos
        </Button>
      } />
      <ModalLayout
        title="Ajustar Créditos"
        description="Adicione ou remova créditos manualmente da conta do cliente."
        containerClassName="sm:max-w-[450px]"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="font-bold rounded-xl h-11"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="adjust-credit-form"
              disabled={loading}
              className="font-bold rounded-xl h-11 px-8 shadow-lg shadow-primary/10"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                "Confirmar Ajuste"
              )}
            </Button>
          </div>
        }
      >
        <form id="adjust-credit-form" onSubmit={handleSubmit} className="space-y-8 py-4">
          <div className="flex gap-2 p-1 bg-muted/30 rounded-2xl border border-zinc-200/50">
            <Button
              type="button"
              variant={type === "add" ? "default" : "ghost"}
              className={cn(
                "flex-1 gap-2 h-11 rounded-xl font-bold transition-all duration-300",
                type === "add" ? "shadow-md scale-[1.02]" : "text-muted-foreground hover:bg-white"
              )}
              onClick={() => setType("add")}
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar
            </Button>
            <Button
              type="button"
              variant={type === "remove" ? "default" : "ghost"}
              className={cn(
                "flex-1 gap-2 h-11 rounded-xl font-bold transition-all duration-300",
                type === "remove" ? "bg-destructive text-destructive-foreground shadow-md scale-[1.02] hover:bg-destructive/90" : "text-muted-foreground hover:bg-white"
              )}
              onClick={() => setType("remove")}
            >
              <MinusCircle className="w-4 h-4" />
              Remover
            </Button>
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Valor do Ajuste (R$)</label>
            <MaskedInput
              mask="currency"
              placeholder="R$ 0,00"
              value={amount}
              onValueChange={(val) => setAmount(String(val))}
              className="h-12 text-lg font-mono tabular-nums font-black rounded-xl border-zinc-200/60 focus:ring-primary/20"
              required
            />
          </div>

          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Motivo / Descrição</label>
            <Textarea
              placeholder="Ex: Devolução de produto, Brinde, Ajuste manual..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] rounded-xl border-zinc-200/60 resize-none focus:ring-primary/20"
              required
            />
          </div>
        </form>
      </ModalLayout>
    </Dialog>
  );
}
