import { describe, it, expect, vi, beforeEach } from "vitest";
import { FinalizeOrderUseCase } from "@/lib/application/use-cases/finalize-order.use-case";
import { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { PaymentMethodType } from "@/lib/domain/entities/order";

describe("FinalizeOrderUseCase", () => {
  let useCase: FinalizeOrderUseCase;
  let orderRepo: any;

  beforeEach(() => {
    orderRepo = {
      findById: vi.fn(),
      savePayments: vi.fn(),
      updateStatus: vi.fn(),
    };
    useCase = new FinalizeOrderUseCase(orderRepo);
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
    expect(orderRepo.savePayments).toHaveBeenCalledWith(orderId, payments);
    expect(orderRepo.updateStatus).toHaveBeenCalledWith(orderId, "PAID");
  });

  it("should throw error if order not found", async () => {
    orderRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({ orderId: "non-existent", payments: [] }))
      .rejects.toThrow("Pedido não encontrado.");
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
