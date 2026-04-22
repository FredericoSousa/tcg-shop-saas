import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItemType = 'inventory' | 'product'

export type CartItem = {
  id: string           // inventoryId for TCG cards, productId for products
  type: CartItemType
  name: string
  set?: string         // Card set code or product category name
  imageUrl: string | null
  price: number
  quantity: number
  maxStock: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  getTotal: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(i => i.id === newItem.id)
          if (existing) {
            const newQty = Math.min(existing.quantity + newItem.quantity, existing.maxStock)
            return {
              items: state.items.map(i =>
                i.id === newItem.id
                  ? { ...i, quantity: newQty }
                  : i
              )
            }
          }
          return { items: [...state.items, newItem] }
        })
      },
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter(i => i.id !== id) }))
      },
      updateQuantity: (id, qty) => {
        set((state) => ({
          items: state.items.map((i) => {
            if (i.id === id) {
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
