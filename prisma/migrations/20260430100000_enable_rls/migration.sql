-- Defense-in-depth tenant isolation. The Prisma $extends hook already
-- filters reads/writes by `tenant_id`; RLS catches any code path that
-- ever forgets to (raw query, future migration, ad-hoc admin tool).
--
-- Policy contract:
--   - `app.tenant_id` GUC is set per query → row visible iff tenant_id matches.
--   - `app.bypass_rls` GUC = 'on' → row visible regardless (cross-tenant
--     workers like the outbox drainer, tenant lookup before request
--     enters a tenant context, login flow that has to find the tenant).
--   - Neither set → no rows visible. Forces every caller to declare intent.
--
-- FORCE is critical: without it, the table owner (the role Prisma
-- connects as) bypasses RLS by default, defeating the purpose.

-- Tables with a tenant_id column
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON inventory_items
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON product_categories
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON products
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customers
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE customer_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_credit_ledger FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON customer_credit_ledger
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE buylist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE buylist_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON buylist_items
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE buylist_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE buylist_proposals FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON buylist_proposals
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON audit_logs
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

-- outbox_events.tenant_id is nullable (system-wide events). Allow null
-- rows when bypass is on; otherwise require a tenant match.
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON outbox_events
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id::text = current_setting('app.tenant_id', true)
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR tenant_id IS NULL
    OR tenant_id::text = current_setting('app.tenant_id', true)
  );

-- Sub-tables: no tenant_id column, so RLS via parent join. order_items
-- and order_payments inherit through orders; buylist_proposal_items
-- through buylist_proposals.
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON order_items
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.tenant_id::text = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.tenant_id::text = current_setting('app.tenant_id', true)
    )
  );

ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_payments FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON order_payments
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_payments.order_id
        AND o.tenant_id::text = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_payments.order_id
        AND o.tenant_id::text = current_setting('app.tenant_id', true)
    )
  );

ALTER TABLE buylist_proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE buylist_proposal_items FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON buylist_proposal_items
  USING (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM buylist_proposals bp
      WHERE bp.id = buylist_proposal_items.buylist_proposal_id
        AND bp.tenant_id::text = current_setting('app.tenant_id', true)
    )
  )
  WITH CHECK (
    current_setting('app.bypass_rls', true) = 'on'
    OR EXISTS (
      SELECT 1 FROM buylist_proposals bp
      WHERE bp.id = buylist_proposal_items.buylist_proposal_id
        AND bp.tenant_id::text = current_setting('app.tenant_id', true)
    )
  );
