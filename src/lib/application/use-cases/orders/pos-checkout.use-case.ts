import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Order } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";
import { generateOrderFriendlyId } from "@/lib/utils/order-utils";
import { ValidationError } from "@/lib/domain/errors/domain.error";
import { DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { enqueueDomainEvent } from "@/lib/domain/events/outbox-publisher";

export interface POSCheckoutRequest {
  items: {
    productId: string;
    quantity: number;
    price: number;
  }[];
  customerData: {
    id?: string;
    name?: string;
    phoneNumber?: string;
  };
}

export interface POSCheckoutResponse {
  orderId: string;
  friendlyId: string;
}

@injectable()
export class POSCheckoutUseCase implements IUseCase<POSCheckoutRequest, POSCheckoutResponse> {
  constructor(
    @inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository,
    @inject(TOKENS.ProductRepository) private productRepo: IProductRepository,
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository
  ) { }

  async execute(request: POSCheckoutRequest): Promise<POSCheckoutResponse> {
    const { items, customerData } = request;

    if (items.length === 0) {
      throw new ValidationError("O carrinho está vazio.");
    }

    const tenantId = getTenantId()!;

    const result = await prisma.$transaction(async (tx) => {
      let customerId: string;
      if (customerData.id) {
        customerId = customerData.id;
      } else if (customerData.phoneNumber) {
        const customer = await this.customerRepo.upsert(customerData.phoneNumber, {
          name: customerData.name,
        }, tx);
        customerId = customer.id;
      } else {
        throw new ValidationError("Cliente ou Telefone é obrigatório.");
      }

      const existingOrder = await this.orderRepo.findPendingPOSOrder(customerId, tx);
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

      let orderId: string;
      let friendlyId: string;

      if (existingOrder) {
        await this.orderRepo.appendToOrder(existingOrder.id, items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })), totalAmount, tx);
        orderId = existingOrder.id;
        friendlyId = existingOrder.friendlyId || "";
      } else {
        const orderEntity: Order = {
          id: "",
          tenantId,
          customerId,
          totalAmount,
          status: "PENDING",
          source: "POS",
          friendlyId: generateOrderFriendlyId(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newOrder = await this.orderRepo.save(orderEntity, items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })), tx);

        orderId = newOrder.id;
        friendlyId = newOrder.friendlyId || "";
      }

      // Decrement product stock atomically inside the transaction.
      for (const item of items) {
        await this.productRepo.decrementStock(item.productId, item.quantity, tx);
      }

      await enqueueDomainEvent(DOMAIN_EVENTS.ORDER_PLACED, {
        orderId,
        tenantId,
        customerId,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      }, tenantId, tx);

      return { orderId, friendlyId, customerId };
    });

    return { orderId: result.orderId, friendlyId: result.friendlyId };
  }
}
