import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { getTenantId } from "../../../tenant-context";

export interface UpdateInventoryRequest {
  id: string;
  price?: number;
  quantity?: number;
}

@injectable()
export class UpdateInventoryUseCase implements IUseCase<UpdateInventoryRequest, void> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: UpdateInventoryRequest): Promise<void> {
    const { id, price, quantity } = request;
    await this.inventoryRepo.update(id, { price, quantity });

    // Publish event for cache invalidation
    domainEvents.publish(DOMAIN_EVENTS.INVENTORY_UPDATED, {
      tenantId: getTenantId()!,
      inventoryIds: [id],
      source: "update_use_case"
    }).catch(err => console.error("Error publishing INVENTORY_UPDATED:", err));
  }
}
