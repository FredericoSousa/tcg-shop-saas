import { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Order, OrderStatus, OrderSource } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";

interface POSCheckoutRequest {
  tenantId: string;
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

export class POSCheckoutUseCase {
  constructor(
    private orderRepo: IOrderRepository,
    private productRepo: IProductRepository,
    private customerRepo: ICustomerRepository
  ) {}

  async execute(request: POSCheckoutRequest): Promise<{ orderId: string }> {
    const { tenantId, items, customerData } = request;

    const orderId = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock for products
      for (const item of items) {
        await this.productRepo.decrementStock(item.productId, tenantId, item.quantity);
      }

      // 2. Resolve Customer
      let customerId: string;
      if (customerData.id) {
        customerId = customerData.id;
      } else if (customerData.phoneNumber) {
        const customer = await this.customerRepo.upsert(customerData.phoneNumber, tenantId, {
          name: customerData.name,
        });
        customerId = customer.id;
      } else {
        throw new Error("Cliente ou Telefone é obrigatório.");
      }

      // 3. Check for existing PENDING POS order
      const existingOrder = await this.orderRepo.findPendingPOSOrder(customerId, tenantId);
      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

      if (existingOrder) {
        await this.orderRepo.appendToOrder(existingOrder.id, items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })), totalAmount);
        return existingOrder.id;
      } else {
        const orderEntity: Order = {
          id: "",
          tenantId,
          customerId,
          totalAmount,
          status: "PENDING",
          source: "POS",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const newOrder = await this.orderRepo.save(orderEntity, items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.price,
        })));

        return newOrder.id;
      }
    });

    return { orderId };
  }
}
