export type AuditAction = "DELETE" | "UPDATE" | "CREATE" | "RESTORE";

export interface AuditLogEntry {
  tenantId: string;
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export interface IAuditLogRepository {
  /**
   * Append-only. Failures here must NOT abort the originating operation
   * — log and swallow. Audit gaps are preferable to user-facing errors.
   */
  record(entry: AuditLogEntry): Promise<void>;
}
