'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCart } from '@/store/useCart'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShoppingCart, Plus, Minus, Image as ImageIcon } from 'lucide-react'
import { processCheckout } from '@/app/actions/checkout'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'

const checkoutSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Insira um e-mail válido').or(z.literal('')),
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  // Try to get tenantId from URL if using dynamic route, or rely on headers/cookie.
  const params = useParams()
  // Since we might be just at /shop, we don't necessarily need tenantId for pushing,
  // but let's navigate relative or absolute to a known route:
  // /shop/success or just /success? Wait, the project structure for shop is just `/shop/page.tsx`.
  // I'll redirect to `/shop/success?orderId=...` to be simpler to implement the success page.

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
    }
  })

  const onSubmit = async (data: CheckoutFormValues) => {
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
      { name: data.name, email: data.email || undefined }
    )

    setIsProcessing(false)

    if (res.success && res.orderId) {
      toast.success('Compra finalizada com sucesso! Seu pedido foi registrado.')
      clearCart()
      setIsOpen(false)
      form.reset()
      router.push(`/shop/success?orderId=${res.orderId}`)
    } else {
      toast.error(res.error || 'Erro ao processar checkout.')
    }
  }

  const total = getTotal()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-14 w-14 rounded-full shadow-xl hover:scale-110 transition-transform bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
      >
        <ShoppingCart className="h-6 w-6 text-primary-foreground" />
        {items.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
            {items.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-md flex flex-col h-full border-l p-0 shadow-2xl">
          <SheetHeader className="p-6 border-b bg-muted/30">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> Carrinho de Compras
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="text-center text-muted-foreground py-16 flex flex-col items-center justify-center h-full">
                <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                  <ShoppingCart className="h-10 w-10 opacity-40 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">O carrinho está vazio</h3>
                <p className="text-sm opacity-80 max-w-[200px]">Adicione produtos do catálogo para continuar a compra.</p>
                <Button onClick={() => setIsOpen(false)} className="mt-6 text-primary" variant="outline">
                  Explorar Catálogo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.inventoryId} className="flex gap-4 border-b pb-4 last:border-0 items-center hover:bg-muted/10 p-2 rounded-lg transition-colors">
                    <div className="h-20 w-14 bg-muted/30 rounded overflow-hidden shrink-0 border border-muted flex items-center justify-center relative">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2" title={item.name}>{item.name}</h4>
                        <p className="text-[10px] text-muted-foreground uppercase mt-0.5">{item.set}</p>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center gap-1.5 bg-muted/50 rounded-md p-1 border">
                          <button
                            type="button"
                            className="h-6 w-6 flex items-center justify-center bg-background rounded shadow-sm disabled:opacity-40 hover:bg-muted transition-colors"
                            onClick={() => updateQuantity(item.inventoryId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                          <div title={item.quantity >= item.maxStock ? "Estoque máximo atingido" : "Adicionar mais"}>
                            <button
                              type="button"
                              className="h-6 w-6 flex items-center justify-center bg-background rounded shadow-sm disabled:opacity-40 hover:bg-muted transition-colors"
                              onClick={() => updateQuantity(item.inventoryId, item.quantity + 1)}
                              disabled={item.quantity >= item.maxStock}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <div className="font-extrabold text-sm text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.inventoryId)}
                            className="text-[10px] text-destructive hover:underline font-medium hover:text-red-700 transition-colors"
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

          <div className="border-t p-6 bg-muted/10 mt-auto shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between mb-4 bg-background p-4 rounded-lg border shadow-sm">
              <span className="font-semibold text-sm">Total do Pedido</span>
              <span className="font-extrabold text-2xl text-primary tracking-tight">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 bg-background p-4 rounded-xl border border-muted/50">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="h-px bg-muted flex-1"></span>
                Dados do Cliente
                <span className="h-px bg-muted flex-1"></span>
              </h4>

              <div className="space-y-1">
                <Input
                  id="name"
                  placeholder="Nome completo *"
                  {...form.register("name")}
                  disabled={items.length === 0 || isProcessing}
                  className={`h-10 text-sm transition-all focus-visible:ring-primary ${form.formState.errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {form.formState.errors.name && (
                  <span className="text-[10px] text-destructive font-medium pl-1">{form.formState.errors.name.message}</span>
                )}
              </div>

              <div className="space-y-1">
                <Input
                  id="email"
                  type="email"
                  placeholder="E-mail (opcional)"
                  {...form.register("email")}
                  disabled={items.length === 0 || isProcessing}
                  className={`h-10 text-sm transition-all focus-visible:ring-primary ${form.formState.errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                {form.formState.errors.email && (
                  <span className="text-[10px] text-destructive font-medium pl-1">{form.formState.errors.email.message}</span>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 mt-4 font-bold text-[15px] shadow-sm transition-all disabled:opacity-50"
                disabled={items.length === 0 || isProcessing}
              >
                {isProcessing ? 'Processando Checkout...' : 'Finalizar Pedido Reservado'}
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
