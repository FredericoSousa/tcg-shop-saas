import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  inventoryId: string
  name: string
  set: string
  imageUrl: string | null
  price: number
  quantity: number // requested quantity
  maxStock: number // absolute limit available right now
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (inventoryId: string) => void
  updateQuantity: (inventoryId: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(i => i.inventoryId === newItem.inventoryId)
          if (existing) {
            // Cannot exceed max stock
            const newQty = Math.min(existing.quantity + newItem.quantity, existing.maxStock)
            return {
              items: state.items.map(i => 
                i.inventoryId === newItem.inventoryId 
                  ? { ...i, quantity: newQty } 
                  : i
              )
            }
          }
          return { items: [...state.items, newItem] }
        })
      },
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter(i => i.inventoryId !== id) }))
      },
      updateQuantity: (id, qty) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.inventoryId === id) {
              const boundedQty = Math.max(1, Math.min(qty, i.maxStock))
              return { ...i, quantity: boundedQty }
            }
            return i
          })
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      }
    }),
    {
      name: 'tcg-store-cart'
    }
  )
)
