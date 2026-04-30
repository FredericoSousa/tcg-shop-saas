import { describe, it, expect } from "vitest";
import {
  posCheckoutSchema,
  posInProgressOrderSchema,
} from "@/lib/infrastructure/validation/pos.schema";

const validItem = {
  productId: "5b8b9c5e-3a3f-4b4d-9c1d-7a2f3b4c5d6e",
  quantity: 2,
  price: 10,
};

describe("posCheckoutSchema", () => {
  it("accepts a valid payload identifying the customer by id", () => {
    const result = posCheckoutSchema.safeParse({
      items: [validItem],
      customerData: { id: "5b8b9c5e-3a3f-4b4d-9c1d-7a2f3b4c5d6e" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid payload identifying the customer by phone number", () => {
    const result = posCheckoutSchema.safeParse({
      items: [validItem],
      customerData: { phoneNumber: "11999998888", name: "Joana" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty cart", () => {
    const result = posCheckoutSchema.safeParse({
      items: [],
      customerData: { phoneNumber: "11999998888" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-UUID productId", () => {
    const result = posCheckoutSchema.safeParse({
      items: [{ ...validItem, productId: "not-a-uuid" }],
      customerData: { phoneNumber: "11999998888" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive prices and quantities", () => {
    const r1 = posCheckoutSchema.safeParse({
      items: [{ ...validItem, price: 0 }],
      customerData: { phoneNumber: "11999998888" },
    });
    const r2 = posCheckoutSchema.safeParse({
      items: [{ ...validItem, quantity: -1 }],
      customerData: { phoneNumber: "11999998888" },
    });
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(false);
  });

  it("rejects when neither customer id nor phone number is supplied", () => {
    const result = posCheckoutSchema.safeParse({
      items: [validItem],
      customerData: { name: "Joana" },
    });
    expect(result.success).toBe(false);
  });
});

describe("posInProgressOrderSchema", () => {
  it("accepts a valid customer UUID", () => {
    expect(
      posInProgressOrderSchema.safeParse({
        customerId: "5b8b9c5e-3a3f-4b4d-9c1d-7a2f3b4c5d6e",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-UUID customerId", () => {
    expect(posInProgressOrderSchema.safeParse({ customerId: "x" }).success).toBe(false);
  });
});
