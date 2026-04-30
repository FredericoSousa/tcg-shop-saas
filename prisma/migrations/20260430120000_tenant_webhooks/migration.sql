-- Outbound webhook configuration per tenant. Empty by default — the
-- worker treats null `webhook_url` as "delivery disabled". The secret
-- is required for HMAC signing; we never let one exist without the
-- other (enforced at the application layer when accepting saves).
ALTER TABLE tenants
  ADD COLUMN webhook_url    TEXT,
  ADD COLUMN webhook_secret TEXT;
