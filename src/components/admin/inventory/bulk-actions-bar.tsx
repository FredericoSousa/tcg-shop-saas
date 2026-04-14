"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit3, Loader2, X, Check } from "lucide-react";
import {
  Dialog,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { InventoryService } from "@/lib/api/services/inventory.service";


interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onActionComplete: () => void;
  selectedIds: string[];
}

import { ModalLayout } from "@/components/ui/modal-layout";

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
      const result = await InventoryService.deleteItems(selectedIds);
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
      const result = await InventoryService.updateItems(
        selectedIds,
        bulkPrice ? parseFloat(bulkPrice) : undefined,
        bulkQuantity ? parseInt(bulkQuantity, 10) : undefined
      );
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
          <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Selecionado(s)</span>
          <span className="text-xl font-black text-white leading-tight">{selectedCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsUpdateDialogOpen(true)}
            className="text-zinc-300 hover:text-white hover:bg-zinc-800 gap-2 h-10 px-4 rounded-xl transition-all"
          >
            <Edit3 className="h-4 w-4" />
            Editar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 h-10 px-4 rounded-xl transition-all"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>

          <div className="w-px h-6 bg-zinc-700 mx-2" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClearSelection}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-10 w-10 rounded-xl transition-all"
            title="Limpar seleção"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <ModalLayout
          title="Excluir em Massa"
          description={`Deseja realmente remover ${selectedCount} itens do seu estoque? Esta ação não pode ser desfeita.`}
          containerClassName="sm:max-w-[450px]"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)} 
                disabled={isDeleting}
                className="font-bold rounded-xl h-11"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete} 
                disabled={isDeleting}
                className="font-bold rounded-xl h-11 px-6 shadow-lg shadow-destructive/10 gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Confirmar Exclusão
              </Button>
            </div>
          }
        >
          <div className="py-6 px-1">
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-800">
              <Trash2 className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium leading-relaxed">
                Atenção: Você está prestes a excluir <span className="font-black underline">{selectedCount}</span> itens permanentemente.
              </p>
            </div>
          </div>
        </ModalLayout>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <ModalLayout
          title="Edição em Massa"
          description={`Os valores serão aplicados a todos os ${selectedCount} itens selecionados.`}
          containerClassName="sm:max-w-[450px]"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button 
                variant="outline" 
                onClick={() => setIsUpdateDialogOpen(false)} 
                disabled={isUpdating}
                className="font-bold rounded-xl h-11"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleBulkUpdate} 
                disabled={isUpdating || (!bulkPrice && !bulkQuantity)}
                className="font-bold rounded-xl h-11 px-8 shadow-lg shadow-primary/10 gap-2"
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Aplicar Alterações
              </Button>
            </div>
          }
        >
          <div className="grid gap-6 py-6 px-1">
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Novo Preço (R$)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 10,00"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="h-12 rounded-xl border-zinc-200/60 focus:ring-primary/20 font-mono tabular-nums font-bold text-base"
              />
            </div>
            <div className="space-y-2.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nova Quantidade</label>
              <Input
                type="number"
                placeholder="Ex: 5"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                className="h-12 rounded-xl border-zinc-200/60 focus:ring-primary/20 font-mono tabular-nums font-bold text-base"
              />
            </div>
            
            <p className="text-[11px] text-muted-foreground italic px-1">
              * Deixe os campos em branco para manter os valores originais.
            </p>
          </div>
        </ModalLayout>
      </Dialog>
    </div>
  );
}
