"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, X, Check, Truck, CreditCard, Ban } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { OrderStatus } from "@prisma/client";

interface OrderBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActionComplete: () => void;
  selectedIds: string[];
}

export function OrderBulkActionsBar({
  selectedCount,
  onClearSelection,
  onActionComplete,
  selectedIds,
}: OrderBulkActionsBarProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/orders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: selectedIds,
          status,
        }),
      });

      if (!response.ok) throw new Error("Failed to update orders");

      const statusLabels: Record<OrderStatus, string> = {
        PENDING: "Pendentes",
        PAID: "Pagos",
        SHIPPED: "Enviados",
        CANCELLED: "Cancelados",
      };

      toast.success(`${selectedCount} pedidos marcados como ${statusLabels[status]}.`);
      setIsConfirmOpen(false);
      onActionComplete();
    } catch {
      toast.error("Erro ao atualizar pedidos selecionados.");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmAction = (status: OrderStatus) => {
    setPendingStatus(status);
    setIsConfirmOpen(true);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl bg-opacity-90">
        <div className="flex flex-col border-r border-zinc-700 pr-4 mr-2">
          <span className="text-xs text-zinc-400 font-medium">Pedidos Selecionados</span>
          <span className="text-xl font-black text-white">{selectedCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmAction("PAID")}
            disabled={isUpdating}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-2 h-10 px-4 rounded-xl"
          >
            <CreditCard className="h-4 w-4" />
            Marcar Pago
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmAction("SHIPPED")}
            disabled={isUpdating}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-2 h-10 px-4 rounded-xl"
          >
            <Truck className="h-4 w-4" />
            Marcar Enviado
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => confirmAction("CANCELLED")}
            disabled={isUpdating}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 h-10 px-4 rounded-xl"
          >
            <Ban className="h-4 w-4" />
            Cancelar
          </Button>

          <div className="w-px h-6 bg-zinc-700 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            disabled={isUpdating}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10 rounded-xl"
            title="Limpar seleção"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Atualização em Massa</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Deseja alterar o status de {selectedCount} pedidos para{" "}
              <span className="font-bold text-white uppercase">{pendingStatus}</span>?
              {pendingStatus === "CANCELLED" && (
                <span className="block mt-2 text-red-400">
                  Atenção: Os itens destes pedidos retornarão ao estoque.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmOpen(false)} 
              disabled={isUpdating}
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => pendingStatus && handleBulkStatusUpdate(pendingStatus)} 
              disabled={isUpdating}
              className={`gap-2 ${
                pendingStatus === "CANCELLED" ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"
              } text-white`}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
