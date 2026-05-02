# ADR 0003 — Outbox pattern para eventos cross-aggregate

- **Status:** aceito
- **Data:** 2026-04-30

## Contexto

Mutations não-triviais disparam efeitos colaterais espalhados:

- `place-order` precisa baixar estoque, registrar audit, mandar
  webhook, invalidar cache.
- `finalize-order` precisa lançar crédito, gerar audit, notificar.
- `process-buylist-proposal` toca ledger + audit + webhook.

Fazer tudo isso **dentro do handler HTTP**, sequencialmente, gera dois
problemas:

1. **Falha parcial**: se o webhook falha, devolvemos 500 ao cliente
   mesmo com a venda já gravada. Pior: se o webhook **commitou** mas
   o handler estourou depois, o estado de negócio não foi salvo e o
   tenant recebeu evento fantasma.
2. **Acoplamento de latência**: a request HTTP carrega a soma de
   todos os I/Os externos.

## Decisão

Adotar **Outbox transacional**:

1. Mutations inserem rows em `outbox_events` **dentro da mesma
   transação** que muda o estado de negócio.
2. Um worker (`drainOutbox()`) lê eventos pendentes, despacha para
   handlers via bus em processo, e marca `processed_at`.
3. Falhas incrementam `attempts` + gravam `last_error`. Acima de
   `MAX_ATTEMPTS = 10` o evento vai para **DLQ** (`dead_lettered_at`
   preenchido — não apagado) e fica disponível para inspeção em
   `/api/cron/outbox-dlq`.

Garantia: **at-least-once com correlação**. Eventos só existem se a
transação commitou; eventos sempre serão entregues (ou DLQ explícita).

Handlers **devem** ser idempotentes — o drainer pode reprocessar
após crash, retry, race entre instâncias.

## Consequências

**Positivas**

- Mutations HTTP voltam ao usuário em ms, não esperam webhook
  externo.
- Falhas externas não derrubam a venda.
- Replay vira recurso de produto: ops pode retomar uma DLQ inteira
  após resolver bug do handler.
- Tracing por evento (correlation-id propagado).

**Negativas**

- **Eventual consistency** entre commit e efeitos (cache invalidado,
  webhook entregue) — geralmente sub-segundo, ocasionalmente segundos.
- Carga adicional no Postgres (uma row extra por mutation com
  efeitos).
- Idempotência é **obrigatória** nos handlers; bug aqui causa
  duplicação silenciosa.

## Alternativas rejeitadas

- **Bus em processo direto** (sem outbox): perde garantia
  transacional. Crash entre commit e publish = evento perdido.
- **Fila externa** (Kafka/SQS/Rabbit) acionada do handler: mesma
  perda de atomicidade entre "commit no DB" e "publish na fila",
  além de operar mais infra.
- **CDC** (Debezium / wal2json): isolamento perfeito, mas overkill
  para o tamanho atual e exige operar Kafka. Possível upgrade futuro
  com a mesma forma de payload.

## Notas operacionais

- Backlog (`processedAt IS NULL`) é a métrica mais importante; alerte
  acima de threshold ou crescimento sustentado.
- DLQ não-vazia → ticket. Cada item indica handler quebrado ou
  destino externo morto.
- Reprocessar DLQ depois de fix: zere `dead_lettered_at`, `attempts`
  e `processed_at`. Worker pega na próxima passagem.
