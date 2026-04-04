'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/app/actions/orders'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SetBadge } from '@/components/ui/set-badge'
import { toast } from 'sonner'
import { OrderStatus } from '@prisma/client'

const StatusT: Record<OrderStatus, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  SHIPPED: 'Enviado',
  CANCELLED: 'Cancelado'
}

const StatusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500 hover:bg-yellow-600',
  PAID: 'bg-green-500 hover:bg-green-600',
  SHIPPED: 'bg-blue-500 hover:bg-blue-600',
  CANCELLED: 'bg-red-500 hover:bg-red-600'
}

export type OrderItemType = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  inventoryItem: {
    condition: string;
    language: string;
    cardTemplate: {
      name: string;
      set: string;
      imageUrl: string | null;
    } | null;
  };
};

export type OrderType = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date | string;
  items: OrderItemType[];
};

export function OrdersClient({ orders }: { orders: OrderType[] }) {
  const [isPending, startTransition] = useTransition()

  const handleStatusChange = (orderId: string, newStatus: string) => {
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, newStatus as OrderStatus)
      if (res.success) {
        toast.success(`O Status do pedido foi alterado para ${StatusT[newStatus as OrderStatus]}.`)
      } else {
        toast.error(res.error || 'Erro ao comunicar alteração.')
      }
    })
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-dashed text-muted-foreground shadow-sm">
        <h3 className="text-xl font-bold mb-2">Sem vendas consolidadas</h3>
        <p>A loja ainda não possui registros transacionais no banco de dados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.map(order => (
        <div key={order.id} className="bg-card border hover:border-muted transition-colors rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border-b">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="font-extrabold text-lg tracking-tight">{order.customerName}</h3>
              </div>
              <div className="text-sm text-muted-foreground font-medium flex flex-wrap items-center gap-2">
                <span>{order.customerEmail || 'Contado Desconhecido'}</span>
                <span className="opacity-50">•</span>
                <span>{new Date(order.createdAt).toLocaleString('pt-BR')}</span>
                <span className="opacity-50">•</span>
                <span className="font-mono text-xs bg-muted/50 text-muted-foreground font-bold px-2 py-0.5 rounded border">
                  #{order.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 shrink-0 md:justify-end">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">Faturamento</p>
                <p className="font-black text-2xl text-primary leading-none">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalAmount)}
                </p>
              </div>
              
              <div className="w-[140px]">
                <Select
                  defaultValue={order.status}
                  disabled={isPending}
                  onValueChange={(val) => handleStatusChange(order.id, val as string)}
                >
                  <SelectTrigger className={`font-bold h-9 border-0 text-white uppercase tracking-wider text-xs ${StatusColors[order.status as OrderStatus]}`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING" className="font-bold text-yellow-600">Pendente</SelectItem>
                    <SelectItem value="PAID" className="font-bold text-green-600">Pago</SelectItem>
                    <SelectItem value="SHIPPED" className="font-bold text-blue-600">Enviado</SelectItem>
                    <SelectItem value="CANCELLED" className="font-bold text-red-600">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-card">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Itens da Compra ({order.items.reduce((acc, item) => acc + item.quantity, 0)})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2.5 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="h-12 w-9 shrink-0 bg-card rounded shadow-sm border overflow-hidden">
                    {item.inventoryItem.cardTemplate?.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={item.inventoryItem.cardTemplate.imageUrl as string} 
                        className="h-full w-full object-cover"
                        alt="Card Artwork"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate leading-tight mb-0.5">
                      {item.inventoryItem.cardTemplate?.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <SetBadge
                        setCode={item.inventoryItem.cardTemplate?.set || ''}
                        iconClassName="h-3 w-3 dark:invert"
                        textClassName="text-[10px] m-0 leading-none text-foreground"
                      />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight inline-flex items-center gap-0.5">
                        <span className="text-gray-300 mx-0.5">•</span> {item.inventoryItem.condition} <span className="text-gray-300 mx-0.5">•</span> {item.inventoryItem.language}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 min-w-16">
                    <p className="text-sm font-black">{item.quantity}x</p>
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.priceAtPurchase)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
