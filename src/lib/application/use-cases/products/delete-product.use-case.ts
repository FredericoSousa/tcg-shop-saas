import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import type { IAuditLogRepository } from "@/lib/domain/repositories/audit-log.repository";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { getTenantId } from "@/lib/tenant-context";

export interface DeleteProductRequest {
  id: string;
  actorId?: string;
}

@injectable()
export class DeleteProductUseCase implements IUseCase<DeleteProductRequest, void> {
  constructor(
    @inject(TOKENS.ProductRepository) private productRepo: IProductRepository,
    @inject(TOKENS.AuditLogRepository) private auditLog: IAuditLogRepository,
  ) {}

  async execute(request: DeleteProductRequest): Promise<void> {
    await this.productRepo.delete(request.id);

    await this.auditLog.record({
      tenantId: getTenantId()!,
      actorId: request.actorId,
      action: "DELETE",
      entityType: "product",
      entityId: request.id,
    });

    domainEvents.publish(DOMAIN_EVENTS.PRODUCT_DELETED, {
      productId: request.id
    }).catch(err => console.error("Error publishing PRODUCT_DELETED event:", err));
  }
}
