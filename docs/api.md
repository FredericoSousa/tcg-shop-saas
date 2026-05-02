# API HTTP

Toda rota fica em [`src/app/api/`](../src/app/api/). O Next 16 usa
Route Handlers (`route.ts`). Mutations sempre passam por um use-case
resolvido pelo container; nada de `prisma.X.create()` direto na rota.

## Superfície

```
src/app/api/
├─ admin/                  # Mutations e leituras autenticadas do tenant
│  ├─ buylist/             # CRUD de buylist items + processamento de propostas
│  ├─ categories/
│  ├─ customers/           # + credit history, insights, ranking
│  ├─ inventory/           # bulk add, bulk update, valuation, report
│  ├─ orders/
│  ├─ pos/                 # POS checkout
│  ├─ products/
│  ├─ reports/             # dashboard, revenue, top-selling
│  ├─ settings/            # branding, contatos, webhooks
│  ├─ upload/
│  └─ users/
├─ storefront/             # Endpoints públicos cacheáveis
│  └─ products/
├─ internal/               # Super-admin (root domain)
│  └─ tenants/             # CRUD de tenants
├─ checkout/               # E-commerce checkout (cliente público)
├─ buylist/                # Submissão pública de proposta
├─ customers/              # Lookup público (cliente identifica-se)
├─ search/                 # Busca de cartas (Scryfall + estoque)
├─ scryfall/               # Proxy de imagens / metadata
├─ inventory/              # Leitura cacheada de inventário
├─ orders/                 # Consulta pública de pedido
├─ tenant/                 # Resolução de tenant (debug)
├─ import-collection-stream/  # Importação em streaming
├─ cron/
│  ├─ drain-outbox/        # Worker do outbox
│  └─ outbox-dlq/          # Inspeção/replay da DLQ
├─ docs/                   # Scalar (referência viva)
└─ health/                 # Health-check
```

## Wrappers de rota

Toda rota deve usar um wrapper apropriado — ele cuida de auth,
tracing, correlation-id e tradução de erros.

| Wrapper | Quando usar |
| --- | --- |
| `withTenantApi(handler)` | Rotas autenticadas do `/admin` (em `src/lib/tenant-server.ts`) |
| `withSuperAdminApi(handler)` | Rotas de `/api/internal/*` |
| `withErrorHandling(handler)` | Rotas públicas (storefront, checkout) — só translate de erro + tracing |

Sem o wrapper você perde correlation-id, span OTel e a tradução
domain-error → HTTP.

## Helpers de resposta

`src/lib/infrastructure/http/api-response.ts`:

```ts
ApiResponse.ok(data)
ApiResponse.badRequest(msg, code, details?)
ApiResponse.notFound(msg, code)
ApiResponse.unauthorized()
ApiResponse.forbidden()
ApiResponse.serverError(msg?, code?)
```

Formato:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "...", "error": { "code": "...", "details": [...] } }
```

## Idempotência

`src/lib/infrastructure/http/idempotency.ts` — mutations sensíveis
(checkout, finalize-order) aceitam `Idempotency-Key`. A chave é
guardada no Redis e a resposta é replicada se a mesma chave reaparece
dentro do TTL.

## Cache HTTP

Endpoints públicos do storefront retornam `Cache-Control` + `ETag` +
`Last-Modified`. Helpers em
[`src/lib/infrastructure/http/cache-headers.ts`](../src/lib/infrastructure/http/cache-headers.ts).
Detalhes em [cache.md](./cache.md).

## Rate-limit

Aplicado no proxy, **antes** da rota:

| Rota | Limite |
| --- | --- |
| `/api/auth/*`, `/login` | 10 req/min/IP |
| `/api/checkout/*` | 15 req/min/IP |
| `/api/*` | 60 req/min/IP |

Login adicionalmente tem throttle por conta. Resposta de excesso:
`429` com `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`.

## OpenAPI

Anotações JSDoc com `swagger-jsdoc` em cada `route.ts`. O builder em
`src/lib/infrastructure/openapi/` consolida e o
`@scalar/nextjs-api-reference` serve em `/api/docs`.

Convenção: cada route documenta `tags`, `summary`, parâmetros,
request body e cada status code que pode retornar.

## CRON

Endpoints em `/api/cron/*` são autenticados por **shared secret**
(header `Authorization: Bearer …`). Configurar o agendador externo
(Vercel Cron, GitHub Actions, etc.) para chamar:

| Endpoint | Frequência sugerida |
| --- | --- |
| `POST /api/cron/drain-outbox` | a cada 30-60s |
| `GET /api/cron/outbox-dlq` | sob demanda (alerta / dashboard) |

## Padrões a seguir ao adicionar uma rota

1. Decida o wrapper (admin / super-admin / público).
2. Resolva o use-case via `container.resolve(UseCase)`.
3. Valide input com Zod **fora** do use-case (helpers em
   `src/lib/validation/`); o use-case revalida apenas se for sua
   regra de domínio.
4. Anote OpenAPI no JSDoc.
5. Para mutations: emita evento via outbox (não direto no bus em
   processo) se algum efeito colateral pode falhar e precisa retry.
6. Devolva via `ApiResponse.*` para manter shape consistente.
