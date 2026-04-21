"use client";

import { Printer, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SuccessActionsProps {
  friendlyId: string;
}

export function SuccessActions({ friendlyId }: SuccessActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(friendlyId);
      setCopied(true);
      toast.success(`Código ${friendlyId} copiado`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <>
      <button
        type="button"
        onClick={handleCopy}
        className="px-6 py-3 bg-background text-foreground font-bold rounded-xl border border-border hover:bg-muted/60 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copiado" : "Copiar Código"}
      </button>
      <button
        type="button"
        onClick={handlePrint}
        className="px-6 py-3 bg-background text-foreground font-bold rounded-xl border border-border hover:bg-muted/60 transition-colors flex items-center justify-center gap-2 min-h-[44px] print:hidden"
      >
        <Printer className="w-4 h-4" />
        Imprimir
      </button>
    </>
  );
}
