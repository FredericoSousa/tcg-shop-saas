import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { PaymentMethodType } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
  InsufficientFundsError
} from "@/lib/domain/errors/domain.error";

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
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository
  ) { }

  async execute(request: FinalizeOrderRequest): Promise<FinalizeOrderResponse> {
    const { orderId, payments } = request;

    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new EntityNotFoundError("Pedido", orderId);
    }

    if (order.status !== "PENDING") {
      throw new BusinessRuleViolationError("Apenas pedidos pendentes podem ser finalizados.");
    }

    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    if (totalPaid < order.totalAmount - 0.01) {
      throw new BusinessRuleViolationError(`Valor total pago (R$ ${totalPaid.toFixed(2)}) é inferior ao total do pedido (R$ ${order.totalAmount.toFixed(2)}).`);
    }

    const customerCreditPayment = payments.find(p => p.method === "STORE_CREDIT");

    await prisma.$transaction(async (tx) => {
      // 1. Handle Store Credit deduction
      if (customerCreditPayment) {
        const customer = await this.customerRepo.findById(order.customerId);
        if (!customer) throw new EntityNotFoundError("Cliente", order.customerId);

        if (customer.creditBalance < customerCreditPayment.amount) {
          throw new InsufficientFundsError("Saldo de créditos insuficiente.");
        }

        await this.customerRepo.updateCreditBalance(order.customerId, -customerCreditPayment.amount, tx);
        // Ledger será registrado via handler escutando ORDER_PAID
      }

      // 2. Save payments
      await this.orderRepo.savePayments(orderId, payments, tx);

      // 3. Update order status
      await this.orderRepo.updateStatus(orderId, "PAID", tx);
    });

    // Publish event
    domainEvents.publish(DOMAIN_EVENTS.ORDER_PAID, {
      orderId,
      tenantId: getTenantId()!,
      payments,
      customerId: order.customerId,
      totalAmount: order.totalAmount
    }).catch(err => console.error("Error publishing ORDER_PAID event:", err));

    return { success: true };
  }
}
