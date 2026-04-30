import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { IAuditLogRepository } from "@/lib/domain/repositories/audit-log.repository";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { getTenantId } from "@/lib/tenant-context";

export interface DeleteCustomerRequest {
  id: string;
  actorId?: string;
}

@injectable()
export class DeleteCustomerUseCase implements IUseCase<DeleteCustomerRequest, void> {
  constructor(
    @inject(TOKENS.CustomerRepository) private customerRepo: ICustomerRepository,
    @inject(TOKENS.AuditLogRepository) private auditLog: IAuditLogRepository,
  ) {}

  async execute(request: DeleteCustomerRequest): Promise<void> {
    await this.customerRepo.delete(request.id);

    await this.auditLog.record({
      tenantId: getTenantId()!,
      actorId: request.actorId,
      action: "DELETE",
      entityType: "customer",
      entityId: request.id,
    });

    domainEvents.publish(DOMAIN_EVENTS.CUSTOMER_DELETED, {
      customerId: request.id
    }).catch(err => console.error("Error publishing CUSTOMER_DELETED event:", err));
  }
}
