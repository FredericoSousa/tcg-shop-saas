import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Order } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "../../tenant-context";
import { IUseCase } from "./use-case.interface";
import { generateOrderFriendlyId } from "@/lib/utils/order-utils";

export interface PlaceOrderRequest {
  items: {
    inventoryId: string;
    quantity: number;
    price: number;
  }[];
  customerData: {
    name?: string;
    email?: string;
    phoneNumber: string;
  };
}

export interface PlaceOrderResponse {
  orderId: string;
}

@injectable()
export class PlaceOrderUseCase implements IUseCase<PlaceOrderRequest, PlaceOrderResponse> {
  constructor(
    @inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository,
    @inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository,
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository
  ) {}

  async execute(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const { items, customerData } = request;

    const orderId = await prisma.$transaction(async () => {
      // 1. Decrement stock for each item
      for (const item of items) {
        await this.inventoryRepo.decrementStock(item.inventoryId, item.quantity);
      }

      // 2. Upsert Customer
      const customer = await this.customerRepo.upsert(customerData.phoneNumber, {
        name: customerData.name,
        email: customerData.email,
      });

      // 3. Create Order
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

      const orderEntity: Order = {
        id: "",
        tenantId: getTenantId()!,
        customerId: customer.id,
        totalAmount,
        status: "PENDING",
        source: "ECOMMERCE",
        friendlyId: generateOrderFriendlyId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newOrder = await this.orderRepo.save(orderEntity, items.map(item => ({
        inventoryItemId: item.inventoryId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      })));

      return newOrder.id;
    });

    return { orderId };
  }
}
