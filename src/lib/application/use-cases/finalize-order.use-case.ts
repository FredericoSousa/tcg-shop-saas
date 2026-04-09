import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { PaymentMethodType } from "@/lib/domain/entities/order";
import { IUseCase } from "./use-case.interface";

export interface FinalizeOrderRequest {
  orderId: string;
  payments: {
    method: PaymentMethodType;
    amount: number;
  }[];
}

export interface FinalizeOrderResponse {
  success: boolean;
}

@injectable()
export class FinalizeOrderUseCase implements IUseCase<FinalizeOrderRequest, FinalizeOrderResponse> {
  constructor(
    @inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository
  ) {}

  async execute(request: FinalizeOrderRequest): Promise<FinalizeOrderResponse> {
    const { orderId, payments } = request;

    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error("Pedido não encontrado.");
    }

    if (order.status !== "PENDING") {
      throw new Error("Apenas pedidos pendentes podem ser finalizados.");
    }

    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);
    
    // We can allow paying more (tip?) or exactly the amount. 
    // But for now let's ensure it covers at least the total amount.
    // Actually, usually in POS you must pay exactly or the system shows change.
    // For simplicity, let's just ensure totalPaid >= totalAmount.
    
    if (totalPaid < order.totalAmount - 0.01) { // Allowing small precision diff
      throw new Error(`Valor total pago (R$ ${totalPaid.toFixed(2)}) é inferior ao total do pedido (R$ ${order.totalAmount.toFixed(2)}).`);
    }

    await this.orderRepo.savePayments(orderId, payments);
    await this.orderRepo.updateStatus(orderId, "PAID");

    return { success: true };
  }
}
