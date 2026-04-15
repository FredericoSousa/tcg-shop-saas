"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { feedback } from "@/lib/utils/feedback";
import { Loader2 } from "lucide-react";
import { ProductService } from "@/lib/api/services/product.service";
import { MaskedInput } from "@/components/ui/masked-input";
import { parseCurrency } from "@/lib/utils/format";
import { ModalLayout } from "@/components/ui/modal-layout";
import { ImageUpload } from "@/components/ui/image-upload";

interface ProductDialogProps {
  children?: React.ReactNode;
  categories: { id: string; name: string }[];
  product?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    category: { id: string; name: string };
    allowNegativeStock: boolean;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProductDialog({
  children,
  categories,
  product,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ProductDialogProps) {
  const [open, setOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const setIsOpen = isControlled ? setControlledOpen : setOpen;

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    categoryId: "",
    imageUrl: "",
    allowNegativeStock: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price.toString(),
        stock: product.stock?.toString() ?? "0",
        categoryId: product.category.id,
        imageUrl: product.imageUrl || "",
        allowNegativeStock: product.allowNegativeStock,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "0",
        categoryId: "",
        imageUrl: "",
        allowNegativeStock: false,
      });
    }
  }, [product, isOpen]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body = {
        ...formData,
        price: parseCurrency(formData.price),
        stock: parseInt(formData.stock) || 0,
      };

      if (product) {
        await ProductService.update(product.id, body);
      } else {
        await ProductService.create(body);
      }

      feedback.success(
        product ? "Produto atualizado com sucesso" : "Produto criado com sucesso"
      );
      if (setIsOpen) {
        setIsOpen(false);
      }
      router.refresh();
    } catch (error) {
      feedback.apiError(error, "Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && (
        <DialogTrigger render={children as React.ReactElement} />
      )}
      <ModalLayout
        title={product ? "Editar Produto" : "Novo Produto"}
        description="Preencha as informações do produto abaixo para salvar no catálogo."
        containerClassName="sm:max-w-[500px]"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsOpen?.(false)}
              className="font-bold rounded-xl h-11"
              type="button"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="product-form"
              disabled={loading}
              className="font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/10"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Salvar Alterações" : "Criar Produto"}
            </Button>
          </div>
        }
      >
        <form id="product-form" onSubmit={onSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="name">Nome do Produto</label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ex: Sleeves Dragon Shield Matter Black"
              className="h-11 rounded-xl"
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="description">Descrição</label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva o produto e suas características..."
              className="min-h-[100px] rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="price">Preço (R$)</label>
              <MaskedInput
                id="price"
                mask="currency"
                value={formData.price}
                onValueChange={(val) =>
                  setFormData({ ...formData, price: String(val) })
                }
                placeholder="R$ 0,00"
                className="h-11 rounded-xl font-mono tabular-nums font-bold"
                required
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="category">Categoria</label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value! })
                }
                required
              >
                <SelectTrigger id="category" className="h-11 rounded-xl">
                  <SelectValue placeholder="Selecione">
                    {categories.find((c) => c.id === formData.categoryId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1" htmlFor="stock">Estoque Inicial</label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              placeholder="0"
              className="h-11 rounded-xl font-bold"
              required
            />
          </div>
          <ImageUpload
            label="Imagem do Produto"
            value={formData.imageUrl || null}
            onChange={(url) => setFormData({ ...formData, imageUrl: url ?? "" })}
            folder="products"
          />
          <div className="flex items-center space-x-2 py-3 px-3 bg-muted/20 rounded-xl border border-dashed">
            <input
              type="checkbox"
              id="allowNegativeStock"
              checked={formData.allowNegativeStock}
              onChange={(e) =>
                setFormData({ ...formData, allowNegativeStock: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shadow-sm"
            />
            <div className="grid gap-0.5 leading-none">
              <label
                htmlFor="allowNegativeStock"
                className="text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Permitir estoque negativo
              </label>
              <p className="text-[10px] text-muted-foreground font-medium">
                Vendas permitidas mesmo sem saldo físico.
              </p>
            </div>
          </div>
        </form>
      </ModalLayout>
    </Dialog>
  );
}
