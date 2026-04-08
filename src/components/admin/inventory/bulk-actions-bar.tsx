"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit3, Loader2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActionComplete: () => void;
  selectedIds: string[];
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onActionComplete,
  selectedIds,
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  
  const [bulkPrice, setBulkPrice] = useState<string>("");
  const [bulkQuantity, setBulkQuantity] = useState<string>("");

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/inventory/items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to delete");

      toast.success(`${selectedCount} itens removidos com sucesso.`);
      setIsDeleteDialogOpen(false);
      onActionComplete();
    } catch {
      toast.error("Erro ao excluir itens selecionados.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkUpdate = async () => {
    if (!bulkPrice && !bulkQuantity) {
      toast.error("Informe pelo menos um campo para atualizar.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/inventory/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          price: bulkPrice ? parseFloat(bulkPrice) : undefined,
          quantity: bulkQuantity ? parseInt(bulkQuantity, 10) : undefined,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to update");

      toast.success(`${selectedCount} itens atualizados com sucesso.`);
      setIsUpdateDialogOpen(false);
      onActionComplete();
    } catch {
      toast.error("Erro ao atualizar itens selecionados.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 text-white rounded-2xl px-6 py-4 shadow-2xl backdrop-blur-xl bg-opacity-90">
        <div className="flex flex-col border-r border-zinc-700 pr-4 mr-2">
          <span className="text-xs text-zinc-400 font-medium">Selecionado(s)</span>
          <span className="text-xl font-black text-white">{selectedCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsUpdateDialogOpen(true)}
            className="text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2 h-10 px-4 rounded-xl"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 h-10 px-4 rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>

          <div className="w-px h-6 bg-zinc-700 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10 rounded-xl"
            title="Limpar seleção"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão em Massa</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Deseja realmente remover {selectedCount} itens do seu estoque? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)} 
              disabled={isDeleting}
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete} 
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Edição em Massa</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Os valores informados serão aplicados a todos os {selectedCount} itens selecionados. Deixe em branco para não alterar um campo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Novo Preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 10.00"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="bg-zinc-800 border-zinc-700 focus:ring-primary text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Nova Quantidade</label>
              <Input
                type="number"
                placeholder="Ex: 5"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="bg-zinc-800 border-zinc-700 focus:ring-primary text-white"
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsUpdateDialogOpen(false)} 
              disabled={isUpdating}
              className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-white"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkUpdate} 
              disabled={isUpdating || (!bulkPrice && !bulkQuantity)}
              className="gap-2 bg-primary hover:bg-primary/90 text-white"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Aplicar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
