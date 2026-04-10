"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PlusCircle, MinusCircle, Loader2 } from "lucide-react";

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
    
    const numAmount = parseFloat(amount.replace(",", "."));
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
          <PlusCircle className="w-4 h-4" />
          Ajustar Créditos
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Créditos do Cliente</DialogTitle>
          <DialogDescription>
            Adicione ou remova créditos manualmente da conta do cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "add" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setType("add")}
            >
              <PlusCircle className="w-4 h-4" />
              Adicionar
            </Button>
            <Button
              type="button"
              variant={type === "remove" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setType("remove")}
            >
              <MinusCircle className="w-4 h-4" />
              Remover
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor (R$)</label>
            <Input
              type="text"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo / Descrição</label>
            <Textarea
              placeholder="Ex: Devolução de produto, Brinde, Ajuste manual..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
