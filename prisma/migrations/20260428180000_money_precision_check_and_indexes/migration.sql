-- Tighten money columns to numeric(12,2). Existing rows with valid two-decimal
-- values are preserved; values exceeding 10 integer digits would fail (none
-- expected at this scale).
ALTER TABLE "inventory_items"          ALTER COLUMN "price"           TYPE numeric(12,2);
ALTER TABLE "products"                 ALTER COLUMN "price"           TYPE numeric(12,2);
ALTER TABLE "orders"                   ALTER COLUMN "total_amount"    TYPE numeric(12,2);
ALTER TABLE "order_payments"           ALTER COLUMN "amount"          TYPE numeric(12,2);
ALTER TABLE "order_items"              ALTER COLUMN "price_at_purchase" TYPE numeric(12,2);
ALTER TABLE "customers"                ALTER COLUMN "credit_balance"  TYPE numeric(12,2);
ALTER TABLE "customer_credit_ledger"   ALTER COLUMN "amount"          TYPE numeric(12,2);
ALTER TABLE "buylist_items"            ALTER COLUMN "price_cash"      TYPE numeric(12,2);
ALTER TABLE "buylist_items"            ALTER COLUMN "price_credit"    TYPE numeric(12,2);
ALTER TABLE "buylist_proposals"        ALTER COLUMN "total_cash"      TYPE numeric(12,2);
ALTER TABLE "buylist_proposals"        ALTER COLUMN "total_credit"    TYPE numeric(12,2);
ALTER TABLE "buylist_proposal_items"   ALTER COLUMN "price_cash"      TYPE numeric(12,2);
ALTER TABLE "buylist_proposal_items"   ALTER COLUMN "price_credit"    TYPE numeric(12,2);

-- Each order_item must reference exactly one of inventory_item or product.
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_source_xor"
  CHECK (num_nonnulls("inventory_item_id", "product_id") = 1);

-- Helpful indexes for reporting and filtering.
CREATE INDEX "customer_credit_ledger_tenant_id_created_at_idx"
  ON "customer_credit_ledger" ("tenant_id", "created_at");

CREATE INDEX "buylist_proposals_tenant_id_status_idx"
  ON "buylist_proposals" ("tenant_id", "status");
