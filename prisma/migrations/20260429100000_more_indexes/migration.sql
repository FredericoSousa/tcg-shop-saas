-- Speeds up the JOIN from BuylistProposal -> BuylistProposalItem.
CREATE INDEX "buylist_proposal_items_buylist_proposal_id_idx"
  ON "buylist_proposal_items" ("buylist_proposal_id");

-- POS checkout reuses pending POS orders by customer; the existing
-- `[tenantId, status, createdAt]` index can't satisfy the customerId filter.
CREATE INDEX "orders_tenant_id_customer_id_status_idx"
  ON "orders" ("tenant_id", "customer_id", "status");

-- Customer credit history queries pull entries by customer ordered by date.
CREATE INDEX "customer_credit_ledger_customer_id_created_at_idx"
  ON "customer_credit_ledger" ("customer_id", "created_at");

-- Partial index optimised for the storefront's hot path:
-- `WHERE tenant_id = ? AND active AND quantity > 0`.
CREATE INDEX "inventory_items_storefront_idx"
  ON "inventory_items" ("tenant_id", "card_template_id")
  WHERE active AND quantity > 0;

-- GIN over JSON metadata enables fast color_identity / type_line lookups
-- (used by storefront filters that previously scanned in JS).
CREATE INDEX "card_templates_metadata_gin_idx"
  ON "card_templates" USING gin ("metadata" jsonb_path_ops);

-- GIN over extras[] enables `hasSome` filters without seq-scan.
CREATE INDEX "inventory_items_extras_gin_idx"
  ON "inventory_items" USING gin ("extras");

-- Trigram support for case-insensitive name search on cards (live search
-- and storefront name filter). pg_trgm is part of contrib so the
-- extension creation is idempotent.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "card_templates_name_trgm_idx"
  ON "card_templates" USING gin ("name" gin_trgm_ops);

-- Transactional outbox: producers write events inside the same
-- transaction as the state change; a worker drains the table.
CREATE TABLE "outbox_events" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    uuid,
  "event_name"   text NOT NULL,
  "payload"      jsonb NOT NULL,
  "created_at"   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" timestamp(3),
  "attempts"     integer NOT NULL DEFAULT 0,
  "last_error"   text
);

CREATE INDEX "outbox_events_processed_at_created_at_idx"
  ON "outbox_events" ("processed_at", "created_at");
CREATE INDEX "outbox_events_tenant_id_event_name_idx"
  ON "outbox_events" ("tenant_id", "event_name");
