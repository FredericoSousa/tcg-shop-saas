import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinalizeOrderUseCase } from "@/lib/application/use-cases/finalize-order.use-case";
import { PaymentMethodType } from "@/lib/domain/entities/order";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn((fn) => fn(vi.fn())),
  },
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
    };
    ledgerRepo = {
      save: vi.fn(),
    };
    useCase = new FinalizeOrderUseCase(orderRepo, customerRepo, ledgerRepo);
  });

  it("should finalize an order with multiple payments", async () => {
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
  });

  it("should finalize an order using store credit", async () => {
    const orderId = "order-1";
    const customerId = "cust-1";
    orderRepo.findById.mockResolvedValue({
      id: orderId,
      customerId,
      status: "PENDING",
      totalAmount: 50,
    });
    customerRepo.findById.mockResolvedValue({
      id: customerId,
      creditBalance: 100,
    });

    const payments = [
      { method: "STORE_CREDIT" as PaymentMethodType, amount: 50 },
    ];

    const result = await useCase.execute({ orderId, payments });

    expect(result.success).toBe(true);
    expect(customerRepo.updateCreditBalance).toHaveBeenCalledWith(customerId, -50, expect.anything());
    expect(ledgerRepo.save).toHaveBeenCalled();
  });

  it("should throw error if store credit balance is insufficient", async () => {
    const orderId = "order-1";
    const customerId = "cust-1";
    orderRepo.findById.mockResolvedValue({
      id: orderId,
      customerId,
      status: "PENDING",
      totalAmount: 50,
    });
    customerRepo.findById.mockResolvedValue({
      id: customerId,
      creditBalance: 30,
    });

    const payments = [
      { method: "STORE_CREDIT" as PaymentMethodType, amount: 50 },
    ];

    await expect(useCase.execute({ orderId, payments }))
      .rejects.toThrow("Saldo de créditos insuficiente.");
  });

  it("should throw error if order not found", async () => {
    orderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ orderId: "non-existent", payments: [] }))
      .rejects.toThrow("Pedido with ID non-existent not found");
  });

  it("should throw error if order is already paid", async () => {
    orderRepo.findById.mockResolvedValue({
      id: "order-1",
      status: "PAID",
      totalAmount: 100,
    });

    await expect(useCase.execute({ orderId: "order-1", payments: [] }))
      .rejects.toThrow("Apenas pedidos pendentes podem ser finalizados.");
  });

  it("should throw error if total paid is insufficient", async () => {
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
