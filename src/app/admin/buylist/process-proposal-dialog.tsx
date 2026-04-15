'use client'

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { feedback } from "@/lib/utils/feedback"
import { useRouter } from "next/navigation"
import { BuylistProposal } from "@/lib/domain/entities/buylist"
import { SetBadge } from "@/components/ui/set-badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface ProcessProposalDialogProps {
  proposal: BuylistProposal
  children: React.ReactNode
}

export function ProcessProposalDialog({ proposal, children }: ProcessProposalDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleProcess = async (action: 'APPROVE' | 'CANCEL', paymentMethod: 'CASH' | 'STORE_CREDIT') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/buylist/proposals/${proposal.id}`, {
        method: 'POST',
        body: JSON.stringify({ action, paymentMethod })
      })

      if (!response.ok) throw new Error("Erro ao processar proposta")

      feedback.success(`Proposta ${action === 'APPROVE' ? 'aprovada' : 'cancelada'} com sucesso!`)
      setOpen(false)
      router.refresh()
    } catch (error) {
      feedback.error("Erro ao processar proposta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle>Proposta #{proposal.id.slice(0, 8)}</DialogTitle>
            <Badge variant="outline">{proposal.status}</Badge>
          </div>
          <DialogDescription>
            Enviada em {new Date(proposal.createdAt).toLocaleDateString()} por {proposal.customer?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg flex flex-col items-center justify-center">
              <span className="text-sm text-muted-foreground">Valor em Dinheiro</span>
              <span className="text-xl font-bold">{formatCurrency(proposal.totalCash)}</span>
            </div>
            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10 flex flex-col items-center justify-center">
              <span className="text-sm text-primary/70">Valor em Crédito</span>
              <span className="text-xl font-bold text-primary">{formatCurrency(proposal.totalCredit)}</span>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-center">Qtd</th>
                  <th className="px-4 py-2 text-right">Crédito Un.</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {proposal.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                       <div className="flex items-center gap-2">
                         <SetBadge setCode={item.cardTemplate?.set || ""} />
                         <div>
                           <p className="font-medium">{item.cardTemplate?.name}</p>
                           <p className="text-[10px] text-muted-foreground uppercase">{item.condition} | {item.language}</p>
                         </div>
                       </div>
                    </td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{formatCurrency(item.priceCredit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {proposal.status === 'PENDING' && (
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="sm:mr-auto" 
              onClick={() => handleProcess('CANCEL', 'CASH')}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Recusar
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => handleProcess('APPROVE', 'CASH')}
                disabled={loading}
              >
                Pagar Dinheiro
              </Button>
              <Button 
                onClick={() => handleProcess('APPROVE', 'STORE_CREDIT')}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Aprovar (Crédito)
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
