# Observabilidade

Três peças trabalhando juntas: **logs estruturados** correlation-aware,
**spans OpenTelemetry**, **erros no Sentry**. Toda request HTTP tem um
único `correlation-id` que aparece nos três.

## Logger

[`src/lib/logger.ts`](../src/lib/logger.ts) — wrapper simples sobre
`console` que injeta `correlation-id` (e `tenantId` quando disponível)
no log estruturado. Uso:

```ts
logger.info("Order placed", { orderId, tenantId });
logger.warn("Webhook failed", { tenantId, attempt: 3 });
logger.error("Outbox dead-lettered", err, { eventName, risk: "outbox_dlq" });
```

Não use `console.log` direto em produção — perde correlation. Em
debug local tudo bem.

## Correlation-id

Propagado por `AsyncLocalStorage` em
[`src/lib/correlation-context.ts`](../src/lib/correlation-context.ts).

Fluxo:

1. Proxy lê `x-correlation-id` da request (se vem de gateway/upstream)
   ou gera novo (`generateCorrelationId()`).
2. Encaminha como header para o handler.
3. `withTenantApi` / `withSuperAdminApi` chamam
   `runWithCorrelationId(id, fn)` antes de invocar o handler.
4. Logger e tracer leem do ALS — sem precisar passar `id` pra cada
   função.

Todo serviço externo que chamamos (Scryfall, webhook de tenant) deve
propagar `X-Correlation-Id` no header de saída quando suportado, para
permitir correlação ponta-a-ponta.

## OpenTelemetry

[`src/lib/observability/tracer.ts`](../src/lib/observability/tracer.ts):

```ts
withSpan(name, attrs, fn)
```

Uso já espalhado em pontos quentes:

| Span | Onde |
| --- | --- |
| `tenant.handler` | wrapper em `tenant-server.ts` |
| `super-admin.handler` | wrapper em `super-admin-server.ts` |
| `outbox.drain` | drainer do outbox |
| `webhook.deliver` | entrega de webhook |
| `scryfall.*` | integrações externas |

Atributos comuns: `tenant.id`, `user.id`, `event.name`, `webhook.url`.

Os exporters são configurados via env (OTLP) — em dev local, sem
exporter, os spans simplesmente não saem.

## Sentry

Configuração em [`src/instrumentation.ts`](../src/instrumentation.ts).

- DSN server: `SENTRY_DSN`
- DSN client: `NEXT_PUBLIC_SENTRY_DSN`
- Sourcemap upload em CI: `SENTRY_ORG`, `SENTRY_PROJECT`,
  `SENTRY_AUTH_TOKEN`

Capturas:

- Erros não tratados subindo dos route handlers.
- `logger.error(...)` re-emite no Sentry.
- Performance é amostrado em produção (taxa configurável).

Tags recomendadas em capturas manuais: `tenantId`, `correlationId`,
`risk` (ex: `"outbox_dlq"`).

## Métricas

Hoje só via spans/logs — não há Prometheus dedicado. Pontos a
monitorar em dashboards / alertas:

| Métrica | Origem | Limiar sugerido |
| --- | --- | --- |
| Outbox backlog | `count(*) FROM outbox_events WHERE processed_at IS NULL` | > 500 ou crescente |
| Outbox DLQ | `count(*) FROM outbox_events WHERE dead_lettered_at IS NOT NULL` | > 0 abre ticket |
| Rate-limit 429 | logs do proxy | spike anômalo |
| Webhook breaker open | logs `breakerName=webhook:*` | qualquer ocorrência sustentada |
| Scryfall breaker open | idem para `breakerName=scryfall` | idem |
| Login throttle hits | logs `login:throttle:*` | spike pode indicar ataque |

## Health-check

`GET /api/health` retorna `200` se DB e Redis estão alcançáveis.
Use para liveness/readiness do orquestrador.

## Padrões ao instrumentar código novo

1. Em handlers HTTP: sempre via `withTenantApi` / `withSuperAdminApi`
   / `withErrorHandling` — eles cuidam de span + correlation.
2. Em código de domínio: nunca importar tracer/logger diretamente; o
   fluxo HTTP já abre o span. Use `logger.warn/error` quando precisar
   de log estruturado.
3. Em jobs / workers: abrir um span de top-level (`outbox.drain`,
   `webhook.deliver`) e colocar `tenant.id` como atributo quando
   disponível.
4. Erros silenciosamente ignorados: nunca. Ou trate (e logue
   `logger.warn`) ou propague.
