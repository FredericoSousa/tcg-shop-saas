# Resiliência

Padrões para sobreviver a integrações externas instáveis e cargas
desbalanceadas. Tudo em
[`src/lib/resilience/`](../src/lib/resilience/) e
[`src/lib/scryfall.ts`](../src/lib/scryfall.ts).

## Circuit breaker

`CircuitBreaker` em
[`src/lib/resilience/circuit-breaker.ts`](../src/lib/resilience/circuit-breaker.ts).

Estados: `closed` → `open` → `half-open` → `closed`.

```ts
new CircuitBreaker({
  name: "scryfall",
  failureThreshold: 5,    // falhas dentro da janela
  windowMs: 60_000,       // janela rolling
  cooldownMs: 60_000,     // tempo no open antes de tentar half-open
});
```

Em uso:

- **Scryfall** — chave única `scryfall`. Se a API externa estiver
  degradada, paramos de bater nela por 60s e devolvemos erro
  domain-friendly em vez de pendurar todo mundo. Commit
  `c109487 feat(resilience): outbox DLQ, Scryfall circuit breaker, OTel spans`.
- **Webhooks** — chave **per-tenant** (`webhook:{tenantId}`). Endpoint
  quebrado de um tenant só pausa entrega para ele.

Se o breaker está `open`, `breaker.exec(fn)` lança imediatamente.
Trate isso explicitamente (`if (err instanceof CircuitOpenError)`)
quando faz sentido devolver fallback.

## Retry com backoff

`retryWithBackoff(fn, opts)` — exponencial com jitter.

```ts
retryWithBackoff(fn, { attempts: 3, baseMs: 500, maxMs: 5_000 });
```

Combina-se com circuit breaker — primeiro entra no breaker, depois
faz retries dentro dele. Se todas as tentativas falharem, o erro
sobe para o caller (e o breaker conta as falhas).

Use **só** para erros transitórios (timeout, 5xx, network). Falhas
determinísticas (4xx, validation) não devem ser retentadas.

## Timeouts

Toda chamada HTTP externa tem timeout via `AbortSignal.timeout(ms)`:

- Webhook delivery: 10s.
- Scryfall: configurado em `scryfall.ts`.
- Scrapers (`src/lib/scrapers/`): definido por scraper.

Sem timeout um endpoint pendurado consome um worker até morrer
sozinho. Sempre defina.

## Locks distribuídos

`SET key value NX PX ttl` no Redis. Usado para serializar:

- Drainer do outbox quando rodado em múltiplas regiões.
- Importação em streaming de coleção.
- Operações que tocam estado compartilhado por tenant e podem ter
  duas instâncias rodando simultaneamente.

TTL deve ser maior que o tempo esperado da operação + uma margem.
Renovar periodicamente para operações longas.

## Outbox como camada de resiliência

O outbox em si é uma forma de resiliência: separa "estado de negócio
mudou" de "efeitos colaterais foram entregues". Detalhes em
[events-and-outbox.md](./events-and-outbox.md).

## DB pool

[`src/lib/prisma.ts`](../src/lib/prisma.ts) usa `@prisma/adapter-pg`
+ `pg.Pool` com defaults ajustados para Supabase/PgBouncer:

```
DB_POOL_MAX=5
DB_POOL_IDLE_MS=10000
DB_CONN_TIMEOUT_MS=5000
```

Em ambientes self-hosted, ajuste `DB_POOL_MAX` para
`(maxConnections / instâncias) - margem`.

## Quando algo cai

Checklist quando integração externa fica instável:

1. Veja logs com `breakerName=...` — se o breaker está `open`,
   esperar o cooldown ou aumentar `cooldownMs`.
2. Veja `outbox_events` com `attempts > 3` — eventos retentando
   indica handler ou destino externo problemático.
3. Veja DLQ (`/api/cron/outbox-dlq`) — se cresceu, decidir replay vs.
   descarte.
4. Health-check `/api/health` para descartar problema de DB/Redis.
