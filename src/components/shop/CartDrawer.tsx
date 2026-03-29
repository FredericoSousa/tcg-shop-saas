'use client'

import { useState } from 'react'
import { useCart } from '@/store/useCart'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { processCheckout } from '@/app/actions/checkout'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio.')
      return
    }
    
    setIsProcessing(true)
    const res = await processCheckout(
      items.map(item => ({
        inventoryId: item.inventoryId,
        quantity: item.quantity,
        price: item.price
      })),
      { name, email }
    )
    
    setIsProcessing(false)
    
    if (res.success) {
      toast.success('Compra finalizada com sucesso! Seu pedido foi registrado.')
      clearCart()
      setIsOpen(false)
      setName('')
      setEmail('')
      router.refresh() // recarregar a tela local (cache) para os itens atualizarem a nova quantity
    } else {
      toast.error(res.error || 'Erro ao processar checkout.')
    }
  }

  const total = getTotal()

  return (
    <>
      <Button 
        variant="default" 
        size="icon" 
        className="relative h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-6 w-6" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
            {items.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full border-l p-0">
        <SheetHeader className="p-6 border-b bg-muted/30">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Carrinho de Compras
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
              <p>O carrinho está vazio</p>
              <Button variant="link" onClick={() => setIsOpen(false)} className="mt-2 text-primary">Voltar às compras</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.inventoryId} className="flex gap-4 border-b pb-4 last:border-0">
                  <div className="h-20 w-14 bg-gray-100 rounded overflow-hidden shrink-0 border">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-[8px]">Sem img</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-sm leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase">{item.set}</p>
                    </div>
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center gap-2 bg-muted rounded-md p-1">
                        <button 
                          type="button"
                          className="h-6 w-6 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50" 
                          onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          type="button"
                          className="h-6 w-6 flex items-center justify-center bg-white rounded shadow-sm disabled:opacity-50" 
                          onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right flex flex-col gap-1 items-end">
                        <div className="font-bold text-sm text-primary">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeItem(item.inventoryId)}
                          className="text-[10px] text-destructive hover:underline font-medium"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t p-6 bg-muted/10 mt-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Subtotal</span>
            <span className="font-bold text-2xl text-primary">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
            </span>
          </div>
          
          <form onSubmit={handleCheckout} className="space-y-3 bg-white p-4 rounded-xl border border-muted/50 mb-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Dados do Cliente</h4>
            <Input 
              placeholder="Seu nome" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={items.length === 0 || isProcessing}
              className="h-9 text-sm"
            />
            <Input 
              type="email"
              placeholder="Seu e-mail (opcional)" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={items.length === 0 || isProcessing}
              className="h-9 text-sm"
            />
            <Button 
              type="submit" 
              className="w-full h-10 mt-4 font-bold disabled:opacity-50"
              disabled={items.length === 0 || isProcessing}
            >
              {isProcessing ? 'Processando Checkout...' : 'Finalizar Pedido'}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
    </>
  )
}
