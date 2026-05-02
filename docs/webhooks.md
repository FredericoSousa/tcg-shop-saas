# Webhooks

Cada tenant pode configurar **um** endpoint que recebe eventos de
domínio (pedido criado, pagamento confirmado, etc.) em tempo real,
assinado com HMAC-SHA256. Implementação em
[`src/lib/application/events/webhook-handlers.ts`](../src/lib/application/events/webhook-handlers.ts).

ADR: [0005 — Webhooks por tenant assinados com HMAC](./adr/0005-tenant-webhooks-hmac.md).

## Configuração

Tabela `tenants` (migration `20260430120000_tenant_webhooks`):

- `webhook_url` (TEXT, nullable) — `null` desativa entrega.
- `webhook_secret` (TEXT, nullable) — segredo HMAC.

Regras (camada de aplicação):

- Os dois campos andam juntos: aceitar um sem o outro é erro de
  validação no use-case `update-settings`.
- Rotação: re-salvar gera novo secret. O secret nunca aparece em logs
  ou response — só no payload de salvar (Settings) e no banco.

## Formato do payload

```json
{
  "eventName": "order.placed",
  "tenantId": "uuid",
  "timestamp": 1714560000,
  "data": { ... }
}
```

Headers enviados pelo `fetch`:

| Header | Valor |
| --- | --- |
| `Content-Type` | `application/json` |
| `X-Webhook-Event` | nome do evento (`order.placed`, etc.) |
| `X-Webhook-Timestamp` | unix epoch (segundos) |
| `X-Webhook-Signature` | `sha256=<hex>` — HMAC do `${timestamp}.${body}` |

## Verificação no consumer

Mesmo esquema usado por Stripe / GitHub. Para evitar replay,
verifique `timestamp` dentro de uma janela razoável (ex: 5 min).

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

function verify(secret: string, header: string, timestamp: string, body: string) {
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`).digest("hex");
  const provided = header.replace(/^sha256=/, "");
  return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
}
```

## Resiliência da entrega

`deliverWebhook` empilha:

1. **Span OTel** (`webhook.deliver`) com `tenant.id`, `webhook.event`,
   `webhook.url`.
2. **Circuit breaker per-tenant** (chave `webhook:{tenantId}`):
   `failureThreshold: 5`, `windowMs: 60_000`, `cooldownMs: 60_000`.
   Um tenant com endpoint quebrado não pausa a entrega para todo
   mundo — o breaker só dele abre.
3. **Retry com backoff** (`attempts: 3`, `baseMs: 500`, `maxMs: 5_000`).
4. **Timeout** de 10s por POST (`AbortSignal.timeout(10_000)`) —
   alguns endpoints de tenant pendurados não devem dangle nossos
   workers.

Se mesmo após todos os retries falhar, a exceção sobe — o **outbox
worker** conta a tentativa e eventualmente dead-letters o evento
(ver [events-and-outbox.md](./events-and-outbox.md)).

Tenants sem webhook configurado: no-op silencioso (debug log) —
**nunca** erro.

## Bypass de RLS

O handler roda dentro do drainer do outbox, que já está em
`withRLSBypass()`. Mas o lookup do tenant é envolvido defensivamente
em `withRLSBypass()` no próprio handler — custo zero e protege se um
caller futuro invocar `deliverWebhook` fora do drainer.

## Eventos entregues

Mesmo conjunto que circula no bus em processo (ver
`event-payloads.ts`). Cada evento que precisa de entrega externa
deve ser explicitamente roteado em `handlers.ts` para o
`webhook-handlers`. Hoje:

- `order.placed`
- `order.paid`
- `customer.credit.adjusted`
- `buylist.approved`
- `product.saved`

## Test seam

`__resetWebhookBreakersForTests()` zera o registry de breakers entre
testes — necessário porque é um `Map` module-level.

## Operação

Para diagnosticar entregas problemáticas:

1. Logs com `webhook:{tenantId}` (breaker) e tracing por
   `correlation-id`.
2. `outbox_events` com `attempts > 3` e `event_name` na lista de
   webhooks.
3. `/api/cron/outbox-dlq` para inspeção dos eventos morto-postados.

Para rotacionar segredo após vazamento: re-salvar o tenant em
Settings (gera secret novo). Eventos em flight com secret antigo
continuam sendo retentados pelo outbox — quando os retries
estourarem, vão para DLQ. Ops pode replay manualmente após o
consumer atualizar a chave.
