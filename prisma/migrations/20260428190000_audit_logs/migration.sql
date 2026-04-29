CREATE TYPE "AuditAction" AS ENUM ('DELETE', 'UPDATE', 'CREATE', 'RESTORE');

CREATE TABLE "audit_logs" (
  "id"          uuid          NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"   uuid          NOT NULL,
  "actor_id"    uuid,
  "action"      "AuditAction" NOT NULL,
  "entity_type" text          NOT NULL,
  "entity_id"   text          NOT NULL,
  "metadata"    jsonb,
  "created_at"  timestamp(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_tenant_id_created_at_idx"
  ON "audit_logs" ("tenant_id", "created_at");

CREATE INDEX "audit_logs_tenant_id_entity_type_entity_id_idx"
  ON "audit_logs" ("tenant_id", "entity_type", "entity_id");
