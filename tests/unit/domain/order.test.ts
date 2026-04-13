import { describe, it, expect } from "vitest";
import {
  canOrderBeCancelled,
  canOrderBeFinalized,
  calculateItemsTotal,
  calculatePaidAmount,
} from "@/lib/domain/entities/order";
import type { OrderItem, OrderPayment, PaymentMethodType } from "@/lib/domain/entities/order";

describe("Order Domain Helpers", () => {
  describe("canOrderBeCancelled", () => {
    it("should allow cancellation of PENDING orders", () => {
      expect(canOrderBeCancelled("PENDING")).toBe(true);
    });

    it("should NOT allow cancellation of PAID orders", () => {
      expect(canOrderBeCancelled("PAID")).toBe(false);
    });

    it("should NOT allow cancellation of SHIPPED orders", () => {
      expect(canOrderBeCancelled("SHIPPED")).toBe(false);
    });

    it("should NOT allow cancellation of already CANCELLED orders", () => {
      expect(canOrderBeCancelled("CANCELLED")).toBe(false);
    });
  });

  describe("canOrderBeFinalized", () => {
    it("should allow finalization of PENDING orders", () => {
      expect(canOrderBeFinalized("PENDING")).toBe(true);
    });

    it("should NOT allow finalization of already PAID orders", () => {
      expect(canOrderBeFinalized("PAID")).toBe(false);
    });
  });

  describe("calculateItemsTotal", () => {
    it("should return 0 for empty items array", () => {
      expect(calculateItemsTotal([])).toBe(0);
    });

    it("should calculate total from price * quantity", () => {
      const items: OrderItem[] = [
        { id: "1", orderId: "o1", quantity: 2, priceAtPurchase: 10 },
        { id: "2", orderId: "o1", quantity: 1, priceAtPurchase: 25 },
      ];
      expect(calculateItemsTotal(items)).toBe(45); // (2*10) + (1*25)
    });
  });

  describe("calculatePaidAmount", () => {
    it("should return 0 for empty payments array", () => {
      expect(calculatePaidAmount([])).toBe(0);
    });

    it("should sum all payment amounts", () => {
      const payments: OrderPayment[] = [
        { id: "p1", orderId: "o1", method: "PIX" as PaymentMethodType, amount: 30, createdAt: new Date() },
        { id: "p2", orderId: "o1", method: "CASH" as PaymentMethodType, amount: 15, createdAt: new Date() },
      ];
      expect(calculatePaidAmount(payments)).toBe(45);
    });
  });
});
