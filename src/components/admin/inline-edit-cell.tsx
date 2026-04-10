"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface InlineEditCellProps {
  value: number;
  id: string;
  field: "price" | "quantity";
  onUpdate?: (newValue: number) => void;
  prefix?: string;
  step?: string;
}

export function InlineEditCell({
  value: initialValue,
  id,
  field,
  onUpdate,
  prefix = "",
  step = "1",
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(initialValue.toString());
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue === initialValue) {
      setIsEditing(false);
      setValue(initialValue.toString());
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/inventory/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          [field]: numericValue,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to update");

      toast.success("Atualizado com sucesso");
      if (onUpdate) onUpdate(numericValue);
      setIsEditing(false);
    } catch {
      toast.error("Erro ao atualizar");
      setValue(initialValue.toString());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue(initialValue.toString());
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 min-w-[80px]">
        <Input
          ref={inputRef}
          type="number"
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="h-8 py-1 px-2 text-right font-mono tabular-nums text-xs"
          disabled={isSaving}
        />
        {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "cursor-pointer hover:bg-primary/5 px-2 py-1 rounded transition-colors text-right font-mono tabular-nums font-medium group relative border border-transparent hover:border-primary/20",
        field === "quantity" && initialValue === 0 && "text-destructive"
      )}
    >
      {prefix}
      {field === "price" 
        ? formatCurrency(initialValue)
        : initialValue
      }
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-primary/10 rounded pointer-events-none">
        <span className="text-[10px] uppercase font-bold text-primary">Editar</span>
      </div>
    </div>
  );
}
