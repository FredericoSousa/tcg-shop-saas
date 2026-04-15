"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Grid, Plus, Trash2, Loader2 } from "lucide-react";
import { feedback } from "@/lib/utils/feedback";
import { CategoryService } from "@/lib/api/services/category.service";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { ModalLayout } from "@/components/ui/modal-layout";

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
      await CategoryService.create(newCategory, showOnEcommerce);
      feedback.success("Categoria criada com sucesso");
      setNewCategory("");
      setShowOnEcommerce(true);
      router.refresh();
    } catch (error) {
      feedback.apiError(error, "Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!categoryToDelete) return;

    setLoading(true);
    try {
      await CategoryService.delete(categoryToDelete.id);
      feedback.success("Categoria excluída");
      setCategoryToDelete(null);
      router.refresh();
    } catch (error) {
      feedback.apiError(error, "Erro ao excluir categoria");
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
            <Button variant="outline" className="gap-2 rounded-xl h-11 px-5 border-zinc-200">
              <Grid className="h-4 w-4" />
              Categorias
            </Button>
          }
        />
        <ModalLayout
          title="Gerenciar Categorias"
          description="Crie novas categorias ou gerencie as existentes para organizar seu catálogo."
          containerClassName="sm:max-w-[450px]"
          className="pb-6"
        >
          <div className="grid gap-8 py-4">
            <form onSubmit={onCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="category-name">Nova Categoria</label>
                <div className="flex gap-2">
                  <Input
                    id="category-name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Ex: Acessórios"
                    className="h-11 rounded-xl"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={loading && !categoryToDelete}
                    className="h-11 w-11 p-0 rounded-xl shadow-lg shadow-primary/10"
                    aria-label="Adicionar categoria"
                  >
                    {loading && !categoryToDelete ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 bg-muted/20 border border-dashed rounded-xl">
                <input
                  type="checkbox"
                  id="show-on-ecommerce"
                  checked={showOnEcommerce}
                  onChange={(e) => setShowOnEcommerce(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm"
                />
                <label htmlFor="show-on-ecommerce" className="text-xs font-bold text-muted-foreground select-none cursor-pointer">
                  Exibir no E-commerce por padrão
                </label>
              </div>
            </form>

            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Categorias Existentes</label>
              <div className="border border-zinc-200/60 rounded-xl divide-y divide-zinc-100 max-h-[300px] overflow-auto bg-white/50 custom-scrollbar shadow-sm">
                {categories.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground italic">
                    Nenhuma categoria criada.
                  </div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-4 group hover:bg-muted/5 transition-colors">
                      <span className="text-sm font-semibold tracking-tight">{cat.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg opacity-0 group-hover:opacity-100"
                        onClick={() => setCategoryToDelete(cat)}
                        title="Excluir categoria"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ModalLayout>
      </Dialog>
    </>
  );
}
