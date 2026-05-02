# Cache

Três camadas, propósitos diferentes:

1. **Redis** — estado compartilhado entre instâncias (rate-limit,
   resolução de tenant, locks, idempotência, caches de leitura caros).
2. **React Cache (Next 16)** — `cache()` + `cacheTag()` em Server
   Components, invalidado por `revalidateTag()`.
3. **HTTP cache** — `Cache-Control` + `ETag` em endpoints de leitura
   públicos do storefront.

## Camada 1 — `ICacheService`

Interface em
[`src/lib/infrastructure/cache/cache-service.ts`](../src/lib/infrastructure/cache/cache-service.ts).
Duas implementações:

- `RedisCacheService` (ioredis) — produção.
- `MemoryCacheService` — testes e fallback quando `CACHE_STORE=memory`
  ou `REDIS_URL` ausente.

Resolvido pelo container via factory; o resto do código injeta
`@inject(TOKENS.CacheService)` sem se importar com qual.

### Convenção de chaves

`{scope}:{id}[:{sub}]`. Exemplos em uso:

| Chave | Propósito | TTL |
| --- | --- | --- |
| `tenant:slug:{slug}` | resolução de subdomínio → tenantId | 60s |
| `ratelimit:{bucket}:{ip}` | rate-limit do proxy | janela do bucket |
| `login:throttle:{email}` | login throttle por conta | 5–15 min |
| `idempotency:{key}` | resposta cacheada de mutation idempotente | TTL definido por rota |
| `lock:{resource}` | lock distribuído (resilience) | curto |

Adicionar chaves novas: definir o scope numa constante para evitar
typos em vários lugares.

## Camada 2 — React Cache

[`src/lib/cache-tags.ts`](../src/lib/cache-tags.ts) centraliza as
tags. Padrão por agregado: `inventory:{tenantId}`,
`products:{tenantId}`, `orders:{tenantId}`, `buylist:{tenantId}`, etc.

Server Components leem com `cache()` + `cacheTag()`. Mutations
disparam evento de domínio que o `cache-handlers.ts` traduz em
`revalidateTag(...)`.

Por que não invalidar direto no use-case: manter use-cases puros
(zero dependência de Next). Toda invalidação é efeito colateral via
outbox + handler.

> ⚠️ Next 16 usa `cacheComponents` (rename de `dynamicIO`). Antes de
> escrever um Server Component novo, leia o doc do Next em
> `node_modules/next/dist/docs/`.

## Camada 3 — HTTP cache

Commit `bb7983a feat(perf): HTTP caching on storefront read endpoints`.
Helpers em
[`src/lib/infrastructure/http/cache-headers.ts`](../src/lib/infrastructure/http/cache-headers.ts).

Para endpoints públicos cacheáveis (catálogo, página de produto):

- `Cache-Control: public, max-age=…, s-maxage=…, stale-while-revalidate=…`
- `ETag` baseado no hash da resposta.
- `Last-Modified` quando aplicável.
- Honra `If-None-Match` retornando 304 sem body.

Storefront é o único bloco que é "leitura pública e cacheável" — POS
e admin são autenticados e geralmente `Cache-Control: private,
no-store`.

## Resolução de tenant: cache duro

`tenant:slug:{slug}` (60s TTL) é hot path em **toda** request. Ele
existe porque a pesquisa por slug não pode ser RLS-aware (a request
ainda não está num contexto de tenant); precisaria sempre passar pelo
DB. 60s é equilíbrio entre invalidação rápida em mudança de slug e
custo de hit em DB.

Quando alterar slug de tenant: ao confirmar, invalidar
`tenant:slug:{oldSlug}` no use-case. Não fazemos isso hoje porque
slugs raramente mudam — quando virar requisito, virar item de TODO.

## Locks distribuídos

[`src/lib/resilience/`](../src/lib/resilience/) usa Redis para locks
serializando operações por recurso (importação de coleção, drainer
do outbox quando rodado em múltiplas regiões). Implementados como
`SET key value NX PX ttl`.

## Quando NÃO cachear

- Resultado depende de `tenantId` mas a chave não inclui? Apague.
- Mutations: nunca. Idempotência é mecanismo separado (chave +
  resposta gravada após sucesso).
- Dados sensíveis (saldo de crédito, audit log) só em React Cache
  com tag — invalidação é obrigatória, não opcional.
