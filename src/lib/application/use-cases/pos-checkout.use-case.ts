import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Order } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";
import { generateOrderFriendlyId } from "@/lib/utils/order-utils";
import { ValidationError } from "@/lib/domain/errors/domain.error";
import { domainEvents, DOMAIN_EVENTS } from "../../domain/events/domain-events";

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

    // Use unknown for tx and cast within repositories to avoid complex type mismatches with Prisma extensions in serverless
    const result = await (prisma as unknown as { $transaction: (fn: (tx: unknown) => Promise<{ orderId: string; friendlyId: string }>) => Promise<{ orderId: string; friendlyId: string }> }).$transaction(async (tx: unknown) => {

      // 1. Resolve Customer
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

      // 3. Check for existing PENDING POS order
      const existingOrder = await this.orderRepo.findPendingPOSOrder(customerId, tx);
      const totalAmount = items.reduce((acc: number, item: { price: number; quantity: number }) => acc + item.price * item.quantity, 0);

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
          tenantId: getTenantId()!,
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

      return { orderId, friendlyId };
    });


    // Publish event outside transaction
    const tenantId = getTenantId()!;
    domainEvents.publish(DOMAIN_EVENTS.ORDER_PLACED, {
      orderId: result.orderId,
      tenantId,
      customerId: request.customerData.id || result.orderId,
      items: request.items
    }).catch(err => {
      console.error("Error publishing ORDER_PLACED event:", err);
    });

    return result as POSCheckoutResponse;
  }
}
