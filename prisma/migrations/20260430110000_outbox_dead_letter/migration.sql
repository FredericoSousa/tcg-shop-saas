-- Surface stuck outbox events for ops. The worker stops retrying past
-- MAX_ATTEMPTS, but until now those rows blended in with the active
-- backlog. A dedicated column + partial index makes the DLQ a cheap
-- query and powers monitoring / replay tooling.
ALTER TABLE outbox_events
  ADD COLUMN dead_lettered_at TIMESTAMP(3);

CREATE INDEX outbox_events_dead_lettered_at_idx
  ON outbox_events (dead_lettered_at)
  WHERE dead_lettered_at IS NOT NULL;
