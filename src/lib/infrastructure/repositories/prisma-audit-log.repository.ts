import { injectable } from "tsyringe";
import { BasePrismaRepository } from "./base-prisma.repository";
import { logger } from "../../logger";
import type { AuditLogEntry, IAuditLogRepository } from "../../domain/repositories/audit-log.repository";

@injectable()
export class PrismaAuditLogRepository extends BasePrismaRepository implements IAuditLogRepository {
  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId: entry.tenantId,
          actorId: entry.actorId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata as never,
        },
      });
    } catch (err) {
      // Audit failures must never abort the user-facing operation —
      // record-and-swallow keeps the API contract stable while still
      // surfacing the issue in logs / Sentry.
      logger.error("Audit log write failed", err as Error, {
        action: "audit_log_record",
        tenantId: entry.tenantId,
        entityType: entry.entityType,
      });
    }
  }
}
