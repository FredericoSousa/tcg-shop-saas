"use client";

import { useState, useEffect, useCallback } from "react";
import { Wallet, Loader2, Landmark } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { AdjustCreditDialog } from "./adjust-credit-dialog";
import { feedback } from "@/lib/utils/feedback";
import { formatCurrency } from "@/lib/utils";

interface CreditEntry {
  id: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  source: string;
  description: string | null;
  createdAt: string;
  orderFriendlyId?: string | null;
}

interface CustomerCreditSectionProps {
  customerId: string;
  initialBalance: number;
}

export function CustomerCreditSection({ customerId, initialBalance }: CustomerCreditSectionProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [history, setHistory] = useState<CreditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/credits/history`);
      if (!response.ok) throw new Error("Falha ao carregar extrato de créditos");
      const result = await response.json();
      setHistory(result.success ? result.data : []);
    } catch (error) {
      feedback.apiError(error);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleBalanceUpdate = (newBalance: number) => {
    setBalance(newBalance);
    fetchHistory();
  };


  return (
    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-zinc-200/50 shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg mt-6">
      <div className="p-6 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Créditos da Loja
            </h2>
            <div className="flex items-center gap-2">
               <span className="text-sm text-muted-foreground uppercase font-black tracking-widest">Saldo Atual:</span>
               <span className="text-lg font-black text-primary">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>
        <AdjustCreditDialog customerId={customerId} onSuccess={handleBalanceUpdate} />
      </div>

      <div className="flex-1 min-h-[300px]">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <Landmark className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Nenhum histórico de créditos encontrado.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/30">
                <TableHead>Data</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors group">
                  <TableCell className="text-muted-foreground text-xs font-medium">
                    {new Date(entry.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      entry.type === 'CREDIT' 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' 
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                    }`}>
                      {entry.type === 'CREDIT' ? (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Entrada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Saída
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]" title={entry.description || ""}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold truncate text-foreground/80">{entry.description || "Ajuste manual"}</span>
                      {entry.orderFriendlyId && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground font-bold bg-muted px-1.5 py-0.5 rounded uppercase tracking-tighter border">
                            Pedido #{entry.orderFriendlyId}
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={`text-right font-black tabular-nums transition-transform group-hover:scale-105 ${
                    entry.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {entry.type === 'CREDIT' ? '+' : '-'} {formatCurrency(entry.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

          </Table>
        )}
      </div>
    </div>
  );
}
