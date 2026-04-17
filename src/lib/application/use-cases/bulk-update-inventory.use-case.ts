import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { IUseCase } from "./use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { getTenantId } from "../../tenant-context";

export interface BulkUpdateInventoryRequest {
  ids: string[];
  price?: number;
  quantity?: number;
}

@injectable()
export class BulkUpdateInventoryUseCase implements IUseCase<BulkUpdateInventoryRequest, void> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: BulkUpdateInventoryRequest): Promise<void> {
    const { ids, price, quantity } = request;
    await this.inventoryRepo.updateMany(ids, { price, quantity });

    // Publish event for cache invalidation
    domainEvents.publish(DOMAIN_EVENTS.INVENTORY_UPDATED, {
      tenantId: getTenantId()!,
      inventoryIds: ids,
      source: "bulk_update_use_case"
    }).catch(err => console.error("Error publishing INVENTORY_UPDATED:", err));
  }
}
