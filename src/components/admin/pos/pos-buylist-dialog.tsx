"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandCoins, Search, Loader2, Eye } from "lucide-react";
import { BuylistProposal } from "@/lib/domain/entities/buylist";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/status-badge";
import { feedback } from "@/lib/utils/feedback";

export function POSBuylistDialog() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [proposals, setProposals] = useState<BuylistProposal[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const resp = await fetch("/api/admin/buylist/proposals");
      const data = await resp.json();
      if (data.success) {
        setProposals(data.data.filter((p: BuylistProposal) => p.status === "PENDING" || p.status === "RECEIVED"));
      }
    } catch {
      feedback.error("Erro ao carregar propostas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchProposals();
  }, [open]);

  const filteredProposals = proposals.filter(p => 
    p.customer?.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="gap-2 font-bold h-11 rounded-xl">
            <HandCoins className="h-4 w-4" />
            Buylist
          </Button>
        }
      />
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="flex items-center gap-3">
            <HandCoins className="h-6 w-6 text-primary" />
            Propostas de Buylist Pendentes
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente ou ID da proposta..." 
              className="pl-10 h-10 rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Carregando propostas...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic">
              Nenhuma proposta pendente encontrada.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <p className="font-bold">{proposal.customer?.name}</p>
                      <StatusBadge status={proposal.status} />
                    </div>
                    <p className="text-2xs text-muted-foreground font-mono uppercase">ID: {proposal.id.split('-')[0]}</p>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-2xs font-bold text-muted-foreground uppercase">Crédito Estimado</p>
                      <p className="font-black text-primary">{formatCurrency(proposal.totalCredit)}</p>
                    </div>
                    <Button 
                       size="sm" 
                       className="gap-2 font-bold rounded-lg"
                       onClick={() => {
                          window.location.href = `/admin/buylist?proposal=${proposal.id}`;
                       }}
                    >
                      <Eye className="h-4 w-4" />
                      Processar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
