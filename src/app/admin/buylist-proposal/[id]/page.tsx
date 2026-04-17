'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  CheckCircle,
  XCircle,
  ChevronLeft,
  Package,
  Clock,
  Phone,
  User,
  HandCoins,
  Loader2,
  FileText
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { BuylistProposal } from '@/lib/domain/entities/buylist'
import { feedback } from '@/lib/utils/feedback'
import { SetBadge } from '@/components/ui/set-badge'
import { StatusBadge } from '@/components/admin/status-badge'
import { PageHeader } from '@/components/admin/page-header'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'

export default function AdminBuylistProposalDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const [proposal, setProposal] = useState<BuylistProposal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    async function fetchProposal() {
      try {
        const response = await fetch(`/api/buylist/proposals/${id}`)
        const res = await response.json()
        if (res.success) {
          setProposal(res.data)
        } else {
          feedback.error('Proposta não encontrada.')
        }
      } catch {
        feedback.error('Erro ao carregar os detalhes da proposta.')
      } finally {
        setIsLoading(false)
      }
    }

    if (id) fetchProposal()
  }, [id])

  const handleProcess = async (action: 'APPROVE' | 'CANCEL', paymentMethod: 'CASH' | 'STORE_CREDIT') => {
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/buylist/proposals/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, paymentMethod })
      })

      if (!response.ok) throw new Error("Erro ao processar proposta")

      feedback.success(`Proposta ${action === 'APPROVE' ? 'aprovada' : 'cancelada'} com sucesso!`)
      // Refresh local state or redirect
      const updatedResponse = await fetch(`/api/buylist/proposals/${id}`)
      const res = await updatedResponse.json()
      if (res.success) setProposal(res.data)

    } catch {
      feedback.error("Erro ao processar proposta")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Proposta não encontrada.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500 pb-12">
      <PageHeader
        title={`Proposta #${proposal.id.slice(0, 8)}`}
        description="Visualize os detalhes e processe a proposta de buylist do cliente."
        icon={HandCoins}
        actions={
          <Button variant="outline" onClick={() => router.push('/admin/buylist')}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Itens da Proposta
                </CardTitle>
                <StatusBadge status={proposal.status} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">Carta</th>
                      <th className="px-6 py-4 text-center">Qtd</th>
                      <th className="px-6 py-4 text-right">Dinheiro Unit.</th>
                      <th className="px-6 py-4 text-right">Crédito Unit.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {proposal.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {item.cardTemplate?.imageUrl ? (
                              <div className="relative w-12 h-16 shrink-0 rounded-md overflow-hidden shadow-sm border border-zinc-200">
                                <Image
                                  src={item.cardTemplate.imageUrl}
                                  alt={item.cardTemplate.name}
                                  className="object-cover"
                                  fill
                                  sizes="48px"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground/30">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="gap-0 cursor-default p-0 px-1.5 border-zinc-200">
                                  <SetBadge setCode={item.cardTemplate?.set || ""} setName={item.cardTemplate?.metadata?.set_name || ""} showText={true} />
                                </Badge>
                                <p className="font-bold text-zinc-900 leading-tight">{item.cardTemplate?.name}</p>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-black border-zinc-300 text-zinc-600 bg-zinc-50">
                                  {item.condition}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 font-black bg-zinc-100 text-zinc-500 border-transparent">
                                  {item.language}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-black text-zinc-700">{item.quantity}</td>
                        <td className="px-6 py-4 text-right tabular-nums text-zinc-600">{formatCurrency(item.priceCash)}</td>
                        <td className="px-6 py-4 text-right tabular-nums font-bold text-primary">{formatCurrency(item.priceCredit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {proposal.staffNotes && (
            <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm">
              <CardHeader className="bg-muted/20 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Observações Internas
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 italic text-zinc-600">
                {proposal.staffNotes}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="border-none shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-zinc-900 text-white leading-none">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Nome</p>
                  <p className="font-bold">{proposal.customer?.name || 'Cliente Avulso'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Telefone</p>
                  <p className="font-bold">{proposal.customer?.phoneNumber || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Recebida em</p>
                  <p className="font-bold">{new Date(proposal.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Totals & Actions */}
          <Card className="border-none shadow-lg bg-white overflow-hidden ring-1 ring-zinc-200">
            <CardHeader className="bg-zinc-50 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-center">Totais da Proposta</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                  <span className="text-xs font-bold text-zinc-500">DINHEIRO</span>
                  <span className="text-xl font-black text-zinc-900">{formatCurrency(proposal.totalCash)}</span>
                </div>
                <div className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/20">
                  <span className="text-xs font-bold text-primary">CRÉDITO LOJA</span>
                  <span className="text-xl font-black text-primary">{formatCurrency(proposal.totalCredit)}</span>
                </div>
              </div>

              {proposal.status === 'PENDING' ? (
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full h-12 font-black shadow-lg shadow-primary/20"
                    disabled={isProcessing}
                    onClick={() => handleProcess('APPROVE', 'STORE_CREDIT')}
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    APROVAR (CRÉDITO)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-12 font-bold"
                    disabled={isProcessing}
                    onClick={() => handleProcess('APPROVE', 'CASH')}
                  >
                    APROVAR (DINHEIRO)
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
                    disabled={isProcessing}
                    onClick={() => handleProcess('CANCEL', 'CASH')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    RECUSAR PROPOSTA
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-300">
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    Proposta já processada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
