# Eventos de domínio e Outbox

Mutations não-triviais frequentemente disparam efeitos colaterais
cross-aggregate: confirmar um pedido baixa estoque, registra audit,
notifica webhook, invalida cache. Fazer tudo isso em sequência **dentro
do handler HTTP** é frágil — qualquer falha externa derruba a request
mesmo quando o estado de negócio já mudou.

A solução adotada: **Outbox transacional + bus em processo**. A
decisão está no [ADR 0003](./adr/0003-outbox-pattern.md).

## Fluxo

```
┌─────────────────┐  same tx   ┌──────────────────┐
│  use-case       │ ──────────►│ outbox_events    │
│ (ex: place-order│            │ INSERT pending   │
│  finalize-order)│            └──────────────────┘
└─────────────────┘                     ▲
        │                               │ pickPending()
        ▼ COMMIT                        │
   resposta ao cliente                  │
                                ┌──────────────────┐
   cron a cada 30-60s ───────► │ drainOutbox()    │
                                │  publica no bus  │
                                │  marca processed │
                                └──────────────────┘
                                         │
                                         ▼
                              ┌────────────────────┐
                              │ handlers           │
                              │  cache, audit,     │
                              │  inventory, credit,│
                              │  notification,     │
                              │  webhook           │
                              └────────────────────┘
```

Garantias:

- **At-least-once**: o INSERT na outbox é parte da mesma transação que
  muda o estado de negócio. Se a tx falha, o evento desaparece junto.
  Se ela commita, o evento será entregue (eventualmente).
- **Sem fantasma**: nunca há evento publicado para mutation que não
  commitou.
- **Idempotência é responsabilidade do handler**: o drainer pode
  reprocessar (após crash, retry, race entre instâncias). Handlers
  devem ser seguros a re-execução.

## Componentes

### `outbox_events` (Postgres)

```
id, tenant_id, event_name, payload (JSONB),
created_at, processed_at, attempts, last_error, dead_lettered_at
```

Índices:

- `(processedAt, createdAt)` para o picker do worker.
- `(tenantId, eventName)` para diagnóstico.
- `(deadLetteredAt) WHERE deadLetteredAt IS NOT NULL` (parcial) para
  consultas de DLQ baratas.

### `outbox-publisher.ts` (domain)

Helper que use-cases chamam dentro da transação. Recebe um
`Prisma.TransactionClient`, `eventName` (string tipada com
`event-payloads.ts`), `tenantId` (opcional), `payload`.

### `drainOutbox()` (`outbox-worker.ts`)

Loop drenando lotes (batch padrão 50):

1. Entra em `withRLSBypass()` (cross-tenant).
2. `outbox.pickPending(batchSize)` retorna eventos com
   `processed_at IS NULL` e `dead_lettered_at IS NULL`.
3. Para cada evento:
   - `domainEvents.publish(eventName, payload)` — bus em processo.
   - Sucesso → `markProcessed(id)`.
   - Falha → `recordFailure(id, message)`. Se `attempts + 1 >=
     MAX_ATTEMPTS (10)` → `markDeadLettered(id)`.
4. Retorna `{ picked, processed, failed, deadLettered }`.

Concorrência: múltiplos workers competem no UPDATE; um vence por row.
Seguro rodar várias instâncias.

### Handlers

Em [`src/lib/application/events/`](../src/lib/application/events/):

| Arquivo | Eventos | O que faz |
| --- | --- | --- |
| `cache-handlers.ts` | mutations diversas | `revalidateTag` no React Cache + invalida Redis |
| `inventory-event-handlers.ts` | `order.placed` | debita `quantity` em `InventoryItem` ou `Product` |
| `customer-credit-handlers.ts` | `customer.credit.adjusted`, pagamentos | escreve `CustomerCreditLedger` e atualiza `creditBalance` |
| `audit-handlers.ts` | mutations sensíveis | grava em `audit_logs` |
| `notification-handlers.ts` | eventos de UI/staff | toasts/internal alerts |
| `webhook-handlers.ts` | qualquer evento | entrega externa assinada (ver [webhooks.md](./webhooks.md)) |

`handlers.ts` é o ponto de registro central — chamado pelo container
no boot. Cada handler subscreve via `domainEvents.on(eventName, fn)`.

### Tipagem dos payloads

`src/lib/domain/events/event-payloads.ts` define as interfaces de cada
evento (`OrderPlacedPayload`, `OrderPaidPayload`,
`CustomerCreditAdjustedPayload`, `ProductSavedPayload`,
`BuylistApprovedPayload`, `InventoryUpdatedPayload`,
`InventoryDeletedPayload`). Use-cases publicam seguindo esses tipos —
o JSONB no banco fica documentado pelo TS.

## Dead-letter queue

Após `MAX_ATTEMPTS = 10`, o evento sai da fila ativa (`dead_lettered_at`
preenchido). Não é apagado — fica disponível para inspeção/replay
por ops via `/api/cron/outbox-dlq`.

A migration `20260430110000_outbox_dead_letter` adiciona o índice
parcial para que essa consulta seja barata mesmo com a outbox
crescendo.

## Como adicionar um novo evento

1. Defina o payload em `event-payloads.ts`.
2. Use-case publica dentro da transação:
   ```ts
   await outboxPublisher.publish(tx, "order.placed", { ...payload });
   ```
3. Crie/edite um handler em `application/events/` e registre em
   `handlers.ts`.
4. Garanta **idempotência**: o handler pode rodar 2x para o mesmo
   `eventId` (use `idempotencyKey` em mutations subsequentes ou
   verifique estado antes de mutar).
5. Em produção, monitore `outbox_events` com `attempts > 3` ou
   `dead_lettered_at IS NOT NULL`.
