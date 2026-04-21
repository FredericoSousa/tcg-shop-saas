"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import { feedback } from "@/lib/utils/feedback";
import { Loader2 } from "lucide-react";

interface InlineEditCellProps {
  value: number;
  id: string;
  field: "price" | "quantity";
  onUpdate?: (newValue: number) => void;
  prefix?: string;
  step?: string;
}

const priceSchema = z
  .number({ message: "Preço inválido" })
  .positive("Preço deve ser maior que zero")
  .max(999999.99, "Preço máximo R$ 999.999,99");

const quantitySchema = z
  .number({ message: "Quantidade inválida" })
  .int("Quantidade deve ser inteira")
  .nonnegative("Quantidade não pode ser negativa")
  .max(999999, "Máximo 999.999");

function validate(field: "price" | "quantity", value: number) {
  const schema = field === "price" ? priceSchema : quantitySchema;
  return schema.safeParse(value);
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
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
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

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSave = async () => {
    const numericValue = parseFloat(value);

    if (Number.isNaN(numericValue) || numericValue === initialValue) {
      setIsEditing(false);
      setValue(initialValue.toString());
      setError(null);
      return;
    }

    const parsed = validate(field, numericValue);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Valor inválido");
      triggerShake();
      return;
    }

    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/inventory/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          [field]: parsed.data,
        }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to update");

      feedback.success("Atualizado com sucesso");
      if (onUpdate) onUpdate(parsed.data);
      setIsEditing(false);
    } catch (error) {
      feedback.apiError(error, "Erro ao atualizar");
      setValue(initialValue.toString());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setValue(initialValue.toString());
      setError(null);
    }
  };

  const handleChange = (newVal: string) => {
    setValue(newVal);
    if (error) {
      const parsed = validate(field, parseFloat(newVal));
      if (parsed.success) setError(null);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 min-w-[90px]">
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            type="number"
            step={step}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            aria-invalid={!!error}
            className={cn(
              "h-8 py-1 px-2 text-right font-mono tabular-nums text-xs transition-all",
              error && "border-destructive focus:ring-destructive/30",
              shake && "animate-in fade-in [animation:shake_0.4s_ease-in-out]"
            )}
            disabled={isSaving}
          />
          {isSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        {error && (
          <span className="text-2xs font-bold text-destructive leading-tight text-right pr-1">
            {error}
          </span>
        )}
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
        <span className="text-2xs uppercase font-bold text-primary">Editar</span>
      </div>
    </div>
  );
}
