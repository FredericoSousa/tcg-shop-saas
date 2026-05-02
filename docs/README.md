# Documentação — TCG Shop SaaS

Guia técnico do projeto. O [README do repositório](../README.md) é o
ponto de entrada (visão geral, setup, scripts). Esta pasta detalha
arquitetura, decisões e subsistemas.

## Guias

| Documento | Para quê |
| --- | --- |
| [architecture.md](./architecture.md) | Camadas (DDD pragmático), regras de dependência, convenções por pasta |
| [multi-tenancy.md](./multi-tenancy.md) | Resolução por subdomínio, contexto de tenant, isolamento app + RLS, super-admin |
| [data-model.md](./data-model.md) | Entidades, relacionamentos, dinheiro/decimal, soft-delete, índices |
| [api.md](./api.md) | Superfície HTTP (admin, storefront, internal, cron), OpenAPI, idempotência |
| [events-and-outbox.md](./events-and-outbox.md) | Domain events, outbox transacional, DLQ, drainer, handlers |
| [webhooks.md](./webhooks.md) | Webhooks por tenant: assinatura HMAC, headers, retry, circuit breaker |
| [security.md](./security.md) | CSP, CSRF, rate-limit, RLS, auditoria, login throttle |
| [cache.md](./cache.md) | `ICacheService`, Redis, HTTP caching, tags do React Cache |
| [observability.md](./observability.md) | Sentry, OpenTelemetry, correlation-id, logger |
| [resilience.md](./resilience.md) | Circuit breaker, retry com backoff, locks Redis |
| [testing.md](./testing.md) | Vitest (unit) e Playwright (e2e); padrões de teste |
| [development.md](./development.md) | Setup local, subdomínios em `*.localhost`, seed, super-admin |

## ADRs

Decisões arquiteturais com impacto duradouro:

- [0001 — Camadas DDD + tsyringe](./adr/0001-ddd-layering.md)
- [0002 — Multi-tenancy por subdomínio](./adr/0002-multi-tenancy-by-subdomain.md)
- [0003 — Outbox pattern para eventos](./adr/0003-outbox-pattern.md)
- [0004 — Postgres RLS como defesa em profundidade](./adr/0004-postgres-rls-defense-in-depth.md)
- [0005 — Webhooks por tenant assinados com HMAC](./adr/0005-tenant-webhooks-hmac.md)

### Quando escrever um novo ADR

Mudanças com impacto arquitetural duradouro: escolha de biblioteca
crítica, modelagem multi-tenant, padrão de concorrência, estratégia de
cache, contratos de API. Numere sequencialmente e siga o template
existente (Contexto / Decisão / Consequências / Alternativas).
