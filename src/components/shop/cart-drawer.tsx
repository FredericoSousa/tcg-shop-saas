'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useCart } from "@/store/use-cart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Plus, Minus, Image as ImageIcon, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { CustomerForm, customerSchema, CustomerFormValues } from '@/components/storefront/customer-form'
import { toastFromError } from '@/lib/ui/toast-from-error'

export function CartDrawer() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart()
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExistingCustomer, setIsExistingCustomer] = useState(false)
  const router = useRouter()

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      phoneNumber: '',
      name: '',
    }
  })

  const onSubmit = async (data: CustomerFormValues) => {
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio.')
      return
    }

    if (!isExistingCustomer) {
      const name = data.name?.trim() ?? ''
      if (name.length < 3) {
        form.setError('name', { type: 'manual', message: 'O nome deve ter pelo menos 3 caracteres' })
        return
      }
    }

    setIsProcessing(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            price: item.price
          })),
          customerData: {
            phoneNumber: data.phoneNumber.replace(/\D/g, ''),
            name: data.name?.trim() || undefined,
          }
        }),
      })

      const res = await response.json()

      if (res.success && res.data?.orderId) {
        toast.success('Compra finalizada com sucesso! Seu pedido foi registrado.')
        clearCart()
        setIsOpen(false)
        form.reset()
        router.push(`/singles/success?orderId=${res.data.orderId}`)
      } else {
        toastFromError(res, { fallbackTitle: 'Erro ao processar checkout', context: 'checkout' })
      }
    } catch (err) {
      toastFromError(err, { fallbackTitle: 'Erro ao processar checkout', context: 'checkout' })
    } finally {
      setIsProcessing(false)
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
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-2xs font-bold h-6 w-6 rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {items.reduce((acc, item) => acc + (item as any).quantity, 0)}
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
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full gap-6 py-8">
                <div className="h-24 w-24 bg-muted/50 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 opacity-40 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">O carrinho está vazio</h3>
                  <p className="text-sm opacity-80">Adicione produtos do catálogo para continuar.</p>
                </div>
                <div className="w-full space-y-2 px-2">
                  <Link
                    href="/singles"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-primary text-primary-foreground font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Explorar Singles
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/buylist"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-muted/60 text-foreground font-bold rounded-xl text-sm hover:bg-muted transition-colors border border-border"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Vender seus Cards
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {items.map((item: any) => (
                  <div key={item.inventoryId} className="flex gap-4 border-b pb-4 last:border-0 items-center hover:bg-muted/10 p-2 rounded-lg transition-colors">
                    <div className="h-20 w-14 bg-muted/30 rounded overflow-hidden shrink-0 border border-muted flex items-center justify-center relative">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-muted-foreground opacity-50" />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-semibold text-sm leading-tight text-foreground line-clamp-2" title={item.name}>{item.name}</h4>
                        <p className="text-2xs text-muted-foreground uppercase mt-0.5">{item.set}</p>
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
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.inventoryId)}
                            className="text-2xs text-destructive hover:underline font-medium hover:text-destructive/80 transition-colors"
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
                {formatCurrency(total)}
              </span>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 bg-background p-4 rounded-xl border border-muted/50">
              <CustomerForm
                form={form}
                disabled={isProcessing}
                onLookupChange={setIsExistingCustomer}
              />

              <Button
                type="submit"
                className="w-full h-11 mt-4 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
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
