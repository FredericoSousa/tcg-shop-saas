import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinalizeOrderUseCase } from "@/lib/application/use-cases/orders/finalize-order.use-case";
import { PaymentMethodType } from "@/lib/domain/entities/order";

const enqueueMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn(vi.fn())),
  },
}));

vi.mock("@/lib/tenant-context", () => ({
  getTenantId: vi.fn(() => "test-tenant-id"),
}));

vi.mock("@/lib/domain/events/outbox-publisher", () => ({
  enqueueDomainEvent: (...args: unknown[]) => enqueueMock(...args),
}));

describe("FinalizeOrderUseCase", () => {
  let useCase: FinalizeOrderUseCase;
  let orderRepo: any;
  let customerRepo: any;
  let ledgerRepo: any;

  beforeEach(() => {
    orderRepo = {
      findById: vi.fn(),
      savePayments: vi.fn(),
      updateStatus: vi.fn(),
    };
    customerRepo = {
      findById: vi.fn(),
      updateCreditBalance: vi.fn(),
      tryDebitCredit: vi.fn().mockResolvedValue(true),
    };
    ledgerRepo = {
      save: vi.fn(),
    };
    useCase = new FinalizeOrderUseCase(orderRepo, customerRepo, ledgerRepo);
    enqueueMock.mockClear();
  });

  it("finalizes an order with multiple cash payments", async () => {
    const orderId = "order-1";
    orderRepo.findById.mockResolvedValue({
      id: orderId,
      status: "PENDING",
      totalAmount: 100,
    });

    const payments = [
      { method: "PIX" as PaymentMethodType, amount: 60 },
      { method: "CASH" as PaymentMethodType, amount: 40 },
    ];

    const result = await useCase.execute({ orderId, payments });

    expect(result.success).toBe(true);
    expect(orderRepo.savePayments).toHaveBeenCalledWith(orderId, payments, expect.anything());
    expect(orderRepo.updateStatus).toHaveBeenCalledWith(orderId, "PAID", expect.anything());
    expect(enqueueMock).toHaveBeenCalledWith(
      "order.paid",
      expect.objectContaining({ orderId, totalAmount: 100 }),
      "test-tenant-id",
      expect.any(Function),
    );
  });

  it("debits store credit atomically and writes a ledger entry", async () => {
    const orderId = "order-1";
    const customerId = "cust-1";
    orderRepo.findById.mockResolvedValue({
      id: orderId,
      customerId,
      status: "PENDING",
      totalAmount: 50,
    });

    const payments = [{ method: "STORE_CREDIT" as PaymentMethodType, amount: 50 }];

    const result = await useCase.execute({ orderId, payments });

    expect(result.success).toBe(true);
    expect(customerRepo.tryDebitCredit).toHaveBeenCalledWith(customerId, 50, expect.anything());
    expect(ledgerRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ customerId, amount: 50, type: "DEBIT", source: "ORDER_PAYMENT" }),
      expect.anything(),
    );
  });

  it("rejects store-credit payments when the atomic debit fails", async () => {
    customerRepo.tryDebitCredit.mockResolvedValue(false);
    const orderId = "order-1";
    orderRepo.findById.mockResolvedValue({
      id: orderId,
      customerId: "cust-1",
      status: "PENDING",
      totalAmount: 50,
    });

    const payments = [{ method: "STORE_CREDIT" as PaymentMethodType, amount: 50 }];

    await expect(useCase.execute({ orderId, payments })).rejects.toThrow(
      "Saldo de créditos insuficiente.",
    );
  });

  it("throws when the order does not exist", async () => {
    orderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ orderId: "non-existent", payments: [] }))
      .rejects.toThrow("Pedido with ID non-existent not found");
  });

  it("throws when the order is no longer pending", async () => {
    orderRepo.findById.mockResolvedValue({
      id: "order-1",
      status: "PAID",
      totalAmount: 100,
    });

    await expect(useCase.execute({ orderId: "order-1", payments: [] }))
      .rejects.toThrow("Apenas pedidos pendentes podem ser finalizados.");
  });

  it("throws when total paid is below the order amount", async () => {
    orderRepo.findById.mockResolvedValue({
      id: "order-1",
      status: "PENDING",
      totalAmount: 100,
    });

    const payments = [{ method: "PIX" as PaymentMethodType, amount: 90 }];

    await expect(useCase.execute({ orderId: "order-1", payments }))
      .rejects.toThrow(/Valor total pago .* é inferior ao total do pedido/);
  });
});
