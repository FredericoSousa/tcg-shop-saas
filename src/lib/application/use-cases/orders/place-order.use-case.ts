import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { Order } from "@/lib/domain/entities/order";
import { prisma } from "@/lib/prisma";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";
import { generateOrderFriendlyId } from "@/lib/utils/order-utils";
import { DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { enqueueDomainEvent } from "@/lib/domain/events/outbox-publisher";
import { ValidationError } from "@/lib/domain/errors/domain.error";

export interface PlaceOrderRequest {
  items: {
    inventoryId?: string;
    productId?: string;
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
export class PlaceOrderUseCase
  implements IUseCase<PlaceOrderRequest, PlaceOrderResponse>
{
  constructor(
    @inject(TOKENS.OrderRepository) private orderRepo: IOrderRepository,
    @inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository,
    @inject(TOKENS.ProductRepository) private productRepo: IProductRepository,
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
  ) {}

  async execute(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const { items, customerData } = request;
    const tenantId = getTenantId()!;

    if (items.length === 0) {
      throw new ValidationError("O pedido não pode estar vazio.");
    }

    const { orderId } = await prisma.$transaction(async (tx) => {
      const customer = await this.customerRepo.upsert(customerData.phoneNumber, {
        name: customerData.name,
        email: customerData.email,
      }, tx);

      const totalAmount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

      const orderEntity: Order = {
        id: "",
        tenantId,
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
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.price,
      })), tx);

      // Conditional UPDATE in the repo guards against overselling.
      for (const item of items) {
        if (item.inventoryId) {
          await this.inventoryRepo.decrementStock(item.inventoryId, item.quantity, tx);
        } else if (item.productId) {
          await this.productRepo.decrementStock(item.productId, item.quantity, tx);
        }
      }

      // Outbox row commits with the order — no missed cache busts.
      await enqueueDomainEvent(DOMAIN_EVENTS.ORDER_PLACED, {
        orderId: newOrder.id,
        tenantId,
        customerId: customer.id,
        items: items.map(item => ({
          inventoryId: item.inventoryId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      }, tenantId, tx);

      return { orderId: newOrder.id };
    });

    return { orderId };
  }
}
