import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { PaymentMethodType } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "../../tenant-context";
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
    @inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository,
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
    @inject(TOKENS.CustomerCreditLedgerRepository) private ledgerRepo: ICustomerCreditLedgerRepository
  ) { }

  async execute(request: FinalizeOrderRequest): Promise<FinalizeOrderResponse> {
    const { orderId, payments } = request;
    const tenantId = getTenantId()!;

    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error("Pedido não encontrado.");
    }

    if (order.status !== "PENDING") {
      throw new Error("Apenas pedidos pendentes podem ser finalizados.");
    }

    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    if (totalPaid < order.totalAmount - 0.01) {
      throw new Error(`Valor total pago (R$ ${totalPaid.toFixed(2)}) é inferior ao total do pedido (R$ ${order.totalAmount.toFixed(2)}).`);
    }

    const customerCreditPayment = payments.find(p => p.method === "STORE_CREDIT");

    await prisma.$transaction(async (tx) => {
      // 1. Handle Store Credit deduction
      if (customerCreditPayment) {
        const customer = await this.customerRepo.findById(order.customerId);
        if (!customer) throw new Error("Cliente não encontrado.");

        if (customer.creditBalance < customerCreditPayment.amount) {
          throw new Error("Saldo de créditos insuficiente.");
        }

        await this.customerRepo.updateCreditBalance(order.customerId, -customerCreditPayment.amount, tx);
        await this.ledgerRepo.save({
          tenantId,
          customerId: order.customerId,
          orderId,
          amount: customerCreditPayment.amount,
          type: "DEBIT",
          source: "ORDER_PAYMENT",
          description: `Pagamento de pedido`,
        }, tx);
      }

      // 2. Save payments
      await this.orderRepo.savePayments(orderId, payments, tx);

      // 3. Update order status
      await this.orderRepo.updateStatus(orderId, "PAID", tx);
    });

    return { success: true };
  }
}
