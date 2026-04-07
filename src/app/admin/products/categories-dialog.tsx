"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Grid, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface CategoriesDialogProps {
  categories: { id: string; name: string }[];
}

export function CategoriesDialog({ categories }: CategoriesDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [showOnEcommerce, setShowOnEcommerce] = useState(true);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategory, showOnEcommerce }),
      });

      if (!res.ok) throw new Error("Erro ao criar categoria");

      toast.success("Categoria criada com sucesso");
      setNewCategory("");
      setShowOnEcommerce(true);
      router.refresh();
    } catch {
      toast.error("Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!categoryToDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir");

      toast.success("Categoria excluída");
      setCategoryToDelete(null);
      router.refresh();
    } catch {
      toast.error("Erro ao excluir categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmModal
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        onConfirm={onDelete}
        title="Excluir Categoria"
        description={`Tem certeza que deseja excluir "${categoryToDelete?.name}"? Isso pode afetar produtos vinculados.`}
        loading={loading}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <Button variant="outline" className="gap-2">
              <Grid className="h-4 w-4" />
              Categorias
            </Button>
          }
        />
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <form onSubmit={onCreate} className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium leading-none" htmlFor="category-name">Nova Categoria</label>
                <div className="flex gap-2">
                  <Input
                    id="category-name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ex: Acessórios"
                    required
                  />
                  <Button type="submit" disabled={loading && !categoryToDelete}>
                    {loading && !categoryToDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-on-ecommerce"
                  checked={showOnEcommerce}
                  onChange={(e) => setShowOnEcommerce(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="show-on-ecommerce" className="text-xs text-muted-foreground select-none">
                  Exibir no E-commerce por padrão
                </label>
              </div>
            </form>

            <div className="space-y-3">
              <label className="text-sm font-medium leading-none">Categorias Existentes</label>
              <div className="border rounded-md divide-y max-h-[300px] overflow-auto">
                {categories.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma categoria criada.
                  </div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3">
                      <span className="text-sm font-medium">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setCategoryToDelete(cat)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
