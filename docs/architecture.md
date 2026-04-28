# Arquitetura

## Camadas

O projeto segue um estilo DDD/clean architecture pragmático. As dependências
sempre apontam de fora para dentro: `app` → `application` → `domain`;
`infrastructure` implementa as interfaces de `domain`.

### `src/lib/domain`

Núcleo do negócio. Zero dependências de framework.

- **`entities/`** — objetos de negócio (`Order`, `InventoryItem`, …)
- **`repositories/`** — interfaces de persistência (`IOrderRepository`, …)
- **`services/`** — regras de domínio que não cabem em uma única entidade
- **`events/`** — eventos de domínio (publicados pelos use-cases)
- **`errors/`** — exceções de domínio (ex: `InsufficientStockError`)

### `src/lib/application`

Orquestra use-cases.

- **`use-cases/`** — um arquivo por caso de uso, implementa
  `IUseCase<Input, Output>`. O uso de `@injectable()` + `@inject(TOKEN)`
  plugamos no container.
- **`events/`** — handlers assinando eventos de domínio.

### `src/lib/infrastructure`

Tudo que conversa com o mundo externo.

- **`repositories/`** — implementações Prisma dos repositórios
- **`cache/`** — abstração `ICacheService` (Redis + in-memory fallback)
- **`http/`** — helpers para rotas Next (`withErrorHandling`, respostas)
- **`container.ts`** — registra bindings tsyringe
- **`tokens.ts`** — identificadores simbólicos de DI

### `src/app`

Rotas Next. Server Components consomem use-cases via `container.resolve(...)`.
Não instanciar repositórios diretamente nas rotas — sempre passar por use-case.

## Multi-tenancy

Pipeline em `src/proxy.ts`:

1. Gera nonce CSP
2. CSRF (`Origin`/`Referer` vs `Host`) em métodos não-safe
3. Rate-limit por IP
4. Resolve `tenantId` a partir do subdomínio (cache Redis, TTL 60s)
5. Se rota protegida (`/admin`) ou de auth: refresh da sessão Supabase +
   checa `app_metadata.tenantId` bate com o subdomínio
6. Injeta `x-tenant-id` e `x-nonce` no request
7. Aplica CSP na response

Server Components lêem `x-tenant-id` via `src/lib/tenant-server.ts`.

## DI Container

`tsyringe` com tokens simbólicos. Bindings centralizados em
`src/lib/infrastructure/container.ts`. Para registrar um novo repositório:

1. Definir interface em `domain/repositories/`
2. Implementar em `infrastructure/repositories/`
3. Adicionar token em `tokens.ts`
4. Registrar no `container.ts`
5. Use-cases recebem via `@inject(TOKENS.XRepository)`

## Cache

`ICacheService` é a fachada. Hoje existe implementação Redis; testes usam
in-memory. Chaves seguem o padrão `{scope}:{id}` (ex: `tenant:slug:abc`,
`ratelimit:api:1.2.3.4`).

## Observabilidade

- **Sentry** inicializado em `src/instrumentation.ts`
- **Logger** em `src/lib/logger.ts` com correlation-id propagado via
  `correlation-context.ts` (AsyncLocalStorage)
