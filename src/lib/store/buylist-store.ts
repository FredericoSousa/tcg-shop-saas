import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BuylistCartItem {
  buylistItemId: string;
  cardTemplateId: string;
  name: string;
  set: string;
  imageUrl: string | null;
  condition: string;
  language: string;
  quantity: number;
  priceCash: number;
  priceCredit: number;
}

interface BuylistState {
  items: BuylistCartItem[];
  addItem: (item: BuylistCartItem) => void;
  removeItem: (buylistItemId: string, condition: string, language: string) => void;
  updateQuantity: (buylistItemId: string, condition: string, language: string, quantity: number) => void;
  clearCart: () => void;
  getTotalCash: () => number;
  getTotalCredit: () => number;
}

export const useBuylistStore = create<BuylistState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (newItem) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) => 
              item.buylistItemId === newItem.buylistItemId && 
              item.condition === newItem.condition && 
              item.language === newItem.language
          );

          if (existingItemIndex > -1) {
            const updatedItems = [...state.items];
            updatedItems[existingItemIndex].quantity += newItem.quantity;
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (buylistItemId, condition, language) => {
        set((state) => ({
          items: state.items.filter(
            (item) => 
              !(item.buylistItemId === buylistItemId && 
                item.condition === condition && 
                item.language === language)
          ),
        }));
      },

      updateQuantity: (buylistItemId, condition, language, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            (item.buylistItemId === buylistItemId && 
             item.condition === condition && 
             item.language === language)
              ? { ...item, quantity: Math.max(1, quantity) }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotalCash: () => {
        return get().items.reduce((total, item) => total + item.priceCash * item.quantity, 0);
      },

      getTotalCredit: () => {
        return get().items.reduce((total, item) => total + item.priceCredit * item.quantity, 0);
      },
    }),
    {
      name: 'buylist-storage',
    }
  )
);
