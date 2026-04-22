import { getTenant } from '@/lib/tenant-server'
import { prisma } from '@/lib/prisma'
import { CheckCircle2, Package, ArrowLeft, MessageCircle, Mail, Clock, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils/format'
import { SuccessActions } from './success-actions'

function buildWhatsAppUrl(phone: string, message: string) {
  const clean = phone.replace(/\D/g, '');
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const tenant = await getTenant();

  if (!tenant) {
    return (
      <div className="p-8 text-center pt-24 bg-muted/20 min-h-screen">
        <h1 className="text-2xl font-bold">Loja não encontrada</h1>
      </div>
    )
  }

  const tenantId = tenant.id;

  const { orderId } = await searchParams

  if (!orderId) {
    return (
      <div className="p-8 text-center pt-24 bg-muted/20 min-h-screen">
        <h1 className="text-2xl font-bold">Pedido não identificado</h1>
        <Link href="/singles" className="text-primary hover:underline mt-4 inline-block">Voltar para a loja</Link>
      </div>
    )
  }

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
      tenantId
    },
    include: {
      customer: true,
      items: {
        include: {
          inventoryItem: {
            include: {
              cardTemplate: true
            }
          }
        }
      }
    }
  })

  if (!order) {
    return (
      <div className="p-8 text-center pt-24 bg-muted/20 min-h-screen">
        <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
        <Link href="/singles" className="text-primary hover:underline mt-4 inline-block">Voltar para a loja</Link>
      </div>
    )
  }

  const friendlyId = order.friendlyId || order.id.slice(0, 8).toUpperCase()

  return (
    <main className="flex-1 bg-muted/20 min-h-screen flex flex-col">
      <div className="container mx-auto px-4 py-16 flex-1 flex flex-col items-center justify-center max-w-2xl">
        <div className="bg-white p-8 rounded-2xl shadow-xl border w-full text-center">
          <div className="mx-auto w-20 h-20 bg-success-muted text-success rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Pedido Confirmado!</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Agradecemos a sua compra na loja <span className="font-semibold">{tenant?.name || 'TCG Shop'}</span>. Seu pedido foi reservado com sucesso no nosso estoque.
          </p>

          <div className="bg-muted/40 rounded-xl p-6 mb-6 text-left border">
            <div className="flex items-center justify-between mb-4 border-b pb-4">
              <div>
                <p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Cód. Pedido</p>
                <p className="font-mono text-sm font-semibold">{friendlyId}</p>
              </div>
              <div className="text-right">
                <p className="text-2xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Cliente</p>
                <p className="text-sm font-semibold">{order.customer.name}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Package className="w-4 h-4" /> Resumo dos Itens
              </h3>
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="font-medium">{item.quantity}x</span>
                    <span className="truncate">{item.inventoryItem?.cardTemplate?.name || 'Item não disponível'}</span>
                  </div>
                  <span className="font-semibold text-muted-foreground">
                    {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold">Total do Pedido</span>
              <span className="font-black text-2xl text-primary">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>

          <div className="bg-info-muted/60 border border-info/20 rounded-xl p-5 mb-6 text-left">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
              <HelpCircle className="w-4 h-4 text-info" />
              O que acontece agora?
            </h3>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <MessageCircle className="w-4 h-4 mt-0.5 text-info shrink-0" />
                <span>
                  <strong className="text-foreground font-semibold">Confirmação por WhatsApp</strong> — enviaremos o status do seu pedido para {order.customer.phoneNumber ? <span className="font-mono">{order.customer.phoneNumber}</span> : 'o telefone cadastrado'}.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 mt-0.5 text-info shrink-0" />
                <span>
                  <strong className="text-foreground font-semibold">Preparo em até 24h úteis</strong> — sua carta será separada, conferida e embalada para envio.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 mt-0.5 text-info shrink-0" />
                <span>
                  <strong className="text-foreground font-semibold">Suporte</strong> — guarde o código <span className="font-mono font-bold">{friendlyId}</span> para qualquer dúvida.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <Link
              href="/singles"
              className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" /> Continuar Comprando
            </Link>
            {tenant?.whatsapp && (
              <Link
                href={buildWhatsAppUrl(
                  tenant.whatsapp,
                  `Olá! Acabei de fazer o pedido *${friendlyId}* na ${tenant.name}. Pode me confirmar?`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#1ebe5d] transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
              </Link>
            )}
            <SuccessActions friendlyId={friendlyId} />
          </div>
        </div>
      </div>
    </main>
  )
}
