import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/tokens";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import type { IAuditLogRepository } from "@/lib/domain/repositories/audit-log.repository";
import { EntityNotFoundError } from "@/lib/domain/errors/domain.error";

export interface EraseCustomerRequest {
  customerId: string;
  /** Authenticated staff member triggering the erasure — for the audit log. */
  actorUserId: string;
  tenantId: string;
}

/**
 * GDPR Article 17 / LGPD Art. 18 right to erasure. We anonymise the
 * customer row in place rather than deleting it: orders, ledger and
 * buylist proposals retain the FK so financial reports stay accurate,
 * but the row no longer carries identifying data.
 *
 * Anonymisation is logged to the audit trail because the action itself
 * needs to be auditable (regulator, fraud investigation, …) even
 * though the underlying data is gone.
 */
@injectable()
export class EraseCustomerUseCase {
  constructor(
    @inject(TOKENS.CustomerRepository) private customers: ICustomerRepository,
    @inject(TOKENS.AuditLogRepository) private audit: IAuditLogRepository,
  ) {}

  async execute(request: EraseCustomerRequest): Promise<void> {
    const customer = await this.customers.findById(request.customerId);
    if (!customer) throw new EntityNotFoundError("Customer", request.customerId);

    await this.customers.anonymise(customer.id);
    await this.audit.record({
      tenantId: request.tenantId,
      actorId: request.actorUserId,
      action: "DELETE",
      entityType: "Customer",
      entityId: customer.id,
      metadata: { reason: "gdpr_erasure" },
    });
  }
}
