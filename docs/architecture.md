# Arquitetura

DDD/clean architecture pragmático, com três camadas e dependências
apontando sempre **de fora para dentro**:

```
app  ──►  application  ──►  domain
                     ▲
                infrastructure
```

`infrastructure` implementa as interfaces declaradas em `domain`.
Nenhum código em `domain` ou `application` importa Prisma, Redis,
Supabase ou Next — isso fica isolado em `infrastructure` (e em uns
poucos helpers de borda como `tenant-server.ts`).

## src/lib/domain — núcleo do negócio

Zero dependência de framework. O que entra aqui só sai por uma decisão
explícita.

| Pasta | O que tem |
| --- | --- |
| `entities/` | Objetos de negócio: `Order`, `InventoryItem`, `Customer`, `BuylistProposal`, `CustomerCreditLedger`, `Product`, `Tenant`, `Report` |
| `repositories/` | Interfaces (`IOrderRepository`, `IInventoryRepository`, …) — só contratos |
| `services/` | Regras que não cabem em uma única entidade. Ex: `card-template.service.ts` |
| `events/` | `domain-events.ts` (event bus em processo) + `event-payloads.ts` + `outbox-publisher.ts` |
| `errors/` | Hierarquia em `domain.error.ts`: `EntityNotFoundError`, `ValidationError`, `BusinessRuleViolationError`, `ConflictError` |

## src/lib/application — use-cases e handlers

Orquestração. Um use-case = um arquivo, um motivo para mudar.

```
application/
├─ use-cases/
│  ├─ buylist/
│  ├─ customers/
│  ├─ gdpr/                # export-customer, erase-customer
│  ├─ inventory/
│  ├─ orders/              # place-order, finalize-order, pos-checkout
│  ├─ products/
│  ├─ reports/
│  ├─ storefront/
│  ├─ tenant/              # create-tenant, list-tenants, update-tenant-admin
│  ├─ users/
│  └─ use-case.interface.ts
└─ events/
   ├─ handlers.ts          # registrationcentral
   ├─ outbox-worker.ts     # drainOutbox()
   ├─ audit-handlers.ts
   ├─ cache-handlers.ts
   ├─ customer-credit-handlers.ts
   ├─ inventory-event-handlers.ts
   ├─ notification-handlers.ts
   └─ webhook-handlers.ts
```

Convenções:

- Cada use-case implementa `IUseCase<Input, Output>` (ver
  `use-case.interface.ts`).
- Use-cases são `@injectable()` e recebem dependências via
  `@inject(TOKENS.X)`.
- **Não** acesse `PrismaClient` diretamente — sempre via repositório.
- Validação de input com Zod no início (helpers em `src/lib/validation/`).
- Errors do domínio sobem como exceção; o wrapper HTTP traduz.

## src/lib/infrastructure — adapters

Tudo que conversa com o mundo externo.

| Pasta | O que tem |
| --- | --- |
| `repositories/` | Implementações Prisma de cada `IXRepository` |
| `cache/` | `MemoryCacheService` + `RedisCacheService` (interface `ICacheService`) |
| `http/` | `api-response.ts`, `cache-headers.ts`, `idempotency.ts` |
| `openapi/` | Builder do schema Scalar |
| `validation/` | Helpers Zod compartilhados |
| `container.ts` | Registra bindings tsyringe |
| `tokens.ts` | Identificadores simbólicos (`TOKENS.OrderRepository`, …) |
| `factory.ts` | Helpers para resolver use-cases em rotas |

### Como adicionar um repositório novo

1. Defina a interface em `domain/repositories/X.repository.ts`.
2. Implemente em `infrastructure/repositories/prisma-X.repository.ts`.
3. Adicione `XRepository` em `infrastructure/tokens.ts`.
4. Registre como singleton em `infrastructure/container.ts`.
5. Use-cases recebem via `@inject(TOKENS.XRepository)`.

## src/lib — helpers de borda

Camada fina, mas não cabe nas três anteriores:

| Arquivo / pasta | Papel |
| --- | --- |
| `prisma.ts` | Cliente Prisma com extensão para auto-injeção de `tenantId` + GUC RLS por transação. Exporta `withRLSBypass` |
| `tenant-server.ts` | Wrapper para Server Components/Routes: lê `x-tenant-id`, sessão, correlation-id, abre span OTel |
| `super-admin-server.ts` | Idem, mas para o painel `/internal` (sem tenant) |
| `tenant-context.ts` | `AsyncLocalStorage` que o Prisma extension consulta |
| `correlation-context.ts` | `AsyncLocalStorage` para correlation-id |
| `logger.ts` | Logger estruturado correlation-aware |
| `rate-limiter.ts` | API low-level usada pelo proxy |
| `cache-tags.ts` | Tags do React Cache (`cacheTag()` do Next 16) |
| `proxy/` | Helpers do middleware: `tenant-resolver`, `client-ip`, `rate-limit-policy`, `responses`, `clear-auth-cookies` |
| `security/` | `csp.ts` (gera nonce + monta CSP), `csrf.ts` (origin check) |
| `supabase/` | `server.ts`, `proxy-client.ts`, `user-metadata.ts` |
| `observability/tracer.ts` | `withSpan(name, attrs, fn)` |
| `resilience/circuit-breaker.ts` | `CircuitBreaker` + `retryWithBackoff` |
| `scryfall.ts` / `scrapers/` / `liga-magic.ts` | Integrações externas |

## src/app — Next App Router

```
app/
├─ (storefront)/        # Storefront público do tenant (subdomínio)
├─ admin/               # Painel da loja (TENANT_ADMIN/STAFF)
├─ internal/            # Painel super-admin (root domain)
├─ api/                 # Rotas HTTP
│  ├─ admin/            # Mutations da loja
│  ├─ storefront/       # Endpoints públicos cacheáveis
│  ├─ internal/         # Super-admin: tenants
│  ├─ cron/             # drain-outbox, outbox-dlq
│  ├─ checkout/         # E-commerce checkout
│  ├─ docs/             # Scalar (OpenAPI live)
│  └─ health/           # Health-check
├─ auth/, login/        # Fluxo Supabase
├─ layout.tsx, error.tsx, not-found.tsx
```

Server Components consomem use-cases via `container.resolve(...)`.
Não instancie repositórios direto numa rota — sempre por use-case.

> **Next 16**: este projeto está em Next 16 (cacheComponents). Antes
> de editar código, consulte `node_modules/next/dist/docs/`. Veja
> [AGENTS.md](../AGENTS.md).

## DI Container

`tsyringe` com tokens simbólicos. Registro centralizado em
[`src/lib/infrastructure/container.ts`](../src/lib/infrastructure/container.ts):

- Repositórios Prisma → `Lifecycle.Singleton`.
- `ICacheService` por factory: Redis se `CACHE_STORE=redis` e
  `REDIS_URL` setado, senão `MemoryCacheService`.
- `registerEventHandlers()` é chamado no boot do container — assina
  os domain events nos handlers da camada de aplicação.

## Convenção de erros

Errors em `domain/errors/domain.error.ts`. O wrapper de rota traduz
para HTTP em `tenant-server.ts` / `super-admin-server.ts`:

| Domain error | HTTP |
| --- | --- |
| `EntityNotFoundError` | 404 |
| `ValidationError` (+ `ZodError`) | 400 |
| `ConflictError` | 409 |
| `BusinessRuleViolationError` | 422 |
| outros `DomainError` | 500 |

## Leitura recomendada por tarefa

- **Adicionar uma feature de tenant** → [data-model.md](./data-model.md)
  + esta página + [multi-tenancy.md](./multi-tenancy.md).
- **Mexer em pedido/estoque/buylist** → [events-and-outbox.md](./events-and-outbox.md)
  para entender efeitos colaterais.
- **Endpoint público novo** → [api.md](./api.md) + [cache.md](./cache.md)
  (HTTP caching).
- **Quebra de produção** → [observability.md](./observability.md) e
  [resilience.md](./resilience.md).
