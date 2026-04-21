"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { ModalLayout } from "@/components/ui/modal-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

const TYPED_THRESHOLD = 10;

interface DestructiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  count: number;
  itemType: string;
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  isPending?: boolean;
}

export function DestructiveConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  itemType,
  title,
  description,
  confirmLabel,
  isPending = false,
}: DestructiveConfirmDialogProps) {
  const requireTyped = count >= TYPED_THRESHOLD;
  const [typed, setTyped] = React.useState("");
  const canConfirm = !requireTyped || typed.trim() === String(count);

  React.useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const handleConfirm = async () => {
    if (!canConfirm || isPending) return;
    await onConfirm();
  };

  const resolvedTitle = title ?? `Remover ${count} ${itemType}`;
  const resolvedConfirm = confirmLabel ?? `Remover ${count}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalLayout
        title={resolvedTitle}
        description={
          typeof description === "string"
            ? description
            : undefined
        }
        containerClassName="sm:max-w-[460px]"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="font-bold rounded-xl h-11"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!canConfirm || isPending}
              className="font-bold rounded-xl h-11 px-6 shadow-lg shadow-destructive/10 gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {resolvedConfirm}
            </Button>
          </div>
        }
      >
        <div className="py-4 px-1 space-y-4">
          <div className="p-4 bg-destructive-muted border border-destructive/20 rounded-2xl flex gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium leading-relaxed">
              {description ?? (
                <>
                  Você está prestes a remover{" "}
                  <span className="font-black underline">
                    {count} {itemType}
                  </span>
                  . Essa ação não pode ser desfeita.
                </>
              )}
            </p>
          </div>

          {requireTyped && (
            <div className="space-y-2">
              <label
                htmlFor="destructive-confirm-input"
                className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1"
              >
                Digite <span className="font-mono text-destructive">{count}</span> para confirmar
              </label>
              <Input
                id="destructive-confirm-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={String(count)}
                inputMode="numeric"
                autoComplete="off"
                className="h-12 rounded-xl font-mono tabular-nums font-bold text-base"
                disabled={isPending}
              />
            </div>
          )}
        </div>
      </ModalLayout>
    </Dialog>
  );
}
