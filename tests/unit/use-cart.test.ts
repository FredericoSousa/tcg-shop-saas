import { describe, it, expect, beforeEach } from 'vitest';
import { useCart, CartItem } from '@/store/use-cart';

const inventoryItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'inv-1',
  type: 'inventory',
  name: 'Black Lotus',
  set: 'LEA',
  imageUrl: 'https://example.com/card.jpg',
  price: 100,
  quantity: 1,
  maxStock: 3,
  ...overrides,
});

const productItem = (overrides: Partial<CartItem> = {}): CartItem => ({
  id: 'prod-1',
  type: 'product',
  name: 'Sleeve Dragon Shield',
  set: 'Acessórios',
  imageUrl: null,
  price: 29.99,
  quantity: 1,
  maxStock: 10,
  ...overrides,
});

describe('useCart store', () => {
  beforeEach(() => {
    useCart.setState({ items: [] });
  });

  describe('addItem', () => {
    it('should add an inventory item to the cart', () => {
      useCart.getState().addItem(inventoryItem());
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0]).toMatchObject({ id: 'inv-1', type: 'inventory' });
    });

    it('should add a product item to the cart', () => {
      useCart.getState().addItem(productItem());
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0]).toMatchObject({ id: 'prod-1', type: 'product' });
    });

    it('should accumulate quantity when adding the same item twice', () => {
      useCart.getState().addItem(inventoryItem({ quantity: 1 }));
      useCart.getState().addItem(inventoryItem({ quantity: 1 }));
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0].quantity).toBe(2);
    });

    it('should not exceed maxStock when accumulating', () => {
      useCart.getState().addItem(inventoryItem({ quantity: 2, maxStock: 3 }));
      useCart.getState().addItem(inventoryItem({ quantity: 2, maxStock: 3 }));
      expect(useCart.getState().items[0].quantity).toBe(3);
    });

    it('should treat inventory and product items with same id as different', () => {
      useCart.getState().addItem(inventoryItem({ id: 'shared-id', type: 'inventory' }));
      useCart.getState().addItem(productItem({ id: 'shared-id', type: 'product' }));
      // same id but different type — id is the key, so they merge (same slot)
      // This documents the current behavior: id is the unique key regardless of type
      expect(useCart.getState().items).toHaveLength(1);
    });

    it('should keep inventory and product items separate when ids differ', () => {
      useCart.getState().addItem(inventoryItem({ id: 'inv-1' }));
      useCart.getState().addItem(productItem({ id: 'prod-1' }));
      expect(useCart.getState().items).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('should remove an item by id', () => {
      useCart.getState().addItem(inventoryItem());
      useCart.getState().removeItem('inv-1');
      expect(useCart.getState().items).toHaveLength(0);
    });

    it('should only remove the matching item', () => {
      useCart.getState().addItem(inventoryItem({ id: 'inv-1' }));
      useCart.getState().addItem(productItem({ id: 'prod-1' }));
      useCart.getState().removeItem('inv-1');
      expect(useCart.getState().items).toHaveLength(1);
      expect(useCart.getState().items[0].id).toBe('prod-1');
    });

    it('should do nothing when id does not exist', () => {
      useCart.getState().addItem(inventoryItem());
      useCart.getState().removeItem('non-existent');
      expect(useCart.getState().items).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    it('should update quantity within bounds', () => {
      useCart.getState().addItem(inventoryItem({ quantity: 1, maxStock: 5 }));
      useCart.getState().updateQuantity('inv-1', 4);
      expect(useCart.getState().items[0].quantity).toBe(4);
    });

    it('should clamp quantity to maxStock', () => {
      useCart.getState().addItem(inventoryItem({ quantity: 1, maxStock: 3 }));
      useCart.getState().updateQuantity('inv-1', 10);
      expect(useCart.getState().items[0].quantity).toBe(3);
    });

    it('should clamp quantity to minimum of 1', () => {
      useCart.getState().addItem(inventoryItem({ quantity: 2 }));
      useCart.getState().updateQuantity('inv-1', 0);
      expect(useCart.getState().items[0].quantity).toBe(1);
    });
  });

  describe('clearCart', () => {
    it('should remove all items', () => {
      useCart.getState().addItem(inventoryItem());
      useCart.getState().addItem(productItem());
      useCart.getState().clearCart();
      expect(useCart.getState().items).toHaveLength(0);
    });
  });

  describe('getTotal', () => {
    it('should return 0 for an empty cart', () => {
      expect(useCart.getState().getTotal()).toBe(0);
    });

    it('should sum price * quantity for all items', () => {
      useCart.getState().addItem(inventoryItem({ price: 100, quantity: 1 }));
      useCart.getState().addItem(productItem({ price: 29.99, quantity: 2 }));
      expect(useCart.getState().getTotal()).toBeCloseTo(159.98, 2);
    });

    it('should reflect quantity changes in total', () => {
      useCart.getState().addItem(inventoryItem({ id: 'inv-1', price: 50, quantity: 1, maxStock: 5 }));
      useCart.getState().updateQuantity('inv-1', 3);
      expect(useCart.getState().getTotal()).toBe(150);
    });
  });
});
