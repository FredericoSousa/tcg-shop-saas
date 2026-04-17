import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { IUseCase } from "./use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { getTenantId } from "../../tenant-context";

export interface DeleteInventoryRequest {
  ids: string[];
}

@injectable()
export class DeleteInventoryUseCase implements IUseCase<DeleteInventoryRequest, void> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: DeleteInventoryRequest): Promise<void> {
    await this.inventoryRepo.deactivateMany(request.ids);

    // Publish event
    domainEvents.publish(DOMAIN_EVENTS.INVENTORY_DELETED, {
      tenantId: getTenantId()!,
      inventoryIds: request.ids
    }).catch(err => console.error("Error publishing INVENTORY_DELETED event:", err));
  }
}
