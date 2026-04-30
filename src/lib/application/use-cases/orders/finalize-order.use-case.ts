import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { ICustomerCreditLedgerRepository } from "@/lib/domain/repositories/customer-credit-ledger.repository";
import { PaymentMethodType } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";
import { DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { enqueueDomainEvent } from "@/lib/domain/events/outbox-publisher";
import {
  EntityNotFoundError,
  BusinessRuleViolationError,
  InsufficientFundsError,
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

// 1 cent — financial values are stored as Decimal(12,2), so any difference
// smaller than this is a rounding artifact, not under-payment.
const PAYMENT_ROUNDING_TOLERANCE = 0.01;

@injectable()
export class FinalizeOrderUseCase implements IUseCase<FinalizeOrderRequest, FinalizeOrderResponse> {
  constructor(
    @inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository,
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
    @inject(TOKENS.CustomerCreditLedgerRepository)
    private ledgerRepo: ICustomerCreditLedgerRepository,
  ) {}

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

    if (totalPaid + PAYMENT_ROUNDING_TOLERANCE < order.totalAmount) {
      throw new BusinessRuleViolationError(
        `Valor total pago (R$ ${totalPaid.toFixed(2)}) é inferior ao total do pedido (R$ ${order.totalAmount.toFixed(2)}).`,
      );
    }

    const tenantId = getTenantId()!;
    const customerCreditPayment = payments.find(p => p.method === "STORE_CREDIT");

    await prisma.$transaction(async (tx) => {
      if (customerCreditPayment) {
        const debited = await this.customerRepo.tryDebitCredit(
          order.customerId,
          customerCreditPayment.amount,
          tx,
        );
        if (!debited) {
          throw new InsufficientFundsError("Saldo de créditos insuficiente.");
        }

        // Ledger record is part of the same transaction so the
        // balance and audit trail can never diverge.
        await this.ledgerRepo.save({
          tenantId,
          customerId: order.customerId,
          orderId,
          amount: customerCreditPayment.amount,
          type: "DEBIT",
          source: "ORDER_PAYMENT",
          description: `Pagamento de pedido #${orderId.slice(0, 8)}`,
        }, tx);
      }

      await this.orderRepo.savePayments(orderId, payments, tx);
      await this.orderRepo.updateStatus(orderId, "PAID", tx);

      await enqueueDomainEvent(DOMAIN_EVENTS.ORDER_PAID, {
        orderId,
        tenantId,
        payments,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
      }, tenantId, tx);
    });

    return { success: true };
  }
}
