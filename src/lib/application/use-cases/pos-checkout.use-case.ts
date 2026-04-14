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
  ) {}

  async execute(request: POSCheckoutRequest): Promise<POSCheckoutResponse> {
    const { items, customerData } = request;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock for products
      for (const item of items) {
        await this.productRepo.decrementStock(item.productId, item.quantity, tx);
      }

      // 2. Resolve Customer
      let customerId: string;
      if (customerData.id) {
        customerId = customerData.id;
      } else if (customerData.phoneNumber) {
        const customer = await this.customerRepo.upsert(customerData.phoneNumber, {
          name: customerData.name,
        }, tx);
        customerId = customer.id;
      } else {
        throw new Error("Cliente ou Telefone é obrigatório.");
      }

      // 3. Check for existing PENDING POS order
      const existingOrder = await this.orderRepo.findPendingPOSOrder(customerId, tx);
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

      if (existingOrder) {
        await this.orderRepo.appendToOrder(existingOrder.id, items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })), totalAmount, tx);
          return { orderId: existingOrder.id, friendlyId: existingOrder.friendlyId || "" };
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

        const newOrder = await this.orderRepo.save(orderEntity, items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })), tx);

        return { orderId: newOrder.id, friendlyId: newOrder.friendlyId || "" };
      }
    });

    return result;
  }
}
