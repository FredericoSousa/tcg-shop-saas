import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { IAuditLogRepository } from "@/lib/domain/repositories/audit-log.repository";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { getTenantId } from "@/lib/tenant-context";

export interface DeleteInventoryRequest {
  ids: string[];
  actorId?: string;
}

@injectable()
export class DeleteInventoryUseCase implements IUseCase<DeleteInventoryRequest, void> {
  constructor(
    @inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository,
    @inject(TOKENS.AuditLogRepository) private auditLog: IAuditLogRepository,
  ) {}

  async execute(request: DeleteInventoryRequest): Promise<void> {
    const tenantId = getTenantId()!;
    await this.inventoryRepo.deactivateMany(request.ids);

    await Promise.all(
      request.ids.map((id) =>
        this.auditLog.record({
          tenantId,
          actorId: request.actorId,
          action: "DELETE",
          entityType: "inventory_item",
          entityId: id,
        }),
      ),
    );

    domainEvents.publish(DOMAIN_EVENTS.INVENTORY_DELETED, {
      tenantId,
      inventoryIds: request.ids
    }).catch(err => console.error("Error publishing INVENTORY_DELETED event:", err));
  }
}
