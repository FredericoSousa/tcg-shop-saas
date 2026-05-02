# TCG Shop SaaS

Plataforma **multi-tenant** para lojas de TCG (Magic, Pokémon, Yu-Gi-Oh!).
Cada lojista tem seu próprio subdomínio com **storefront público**, **PDV
(POS)**, **admin web**, **gestão de estoque/produtos/clientes**, **buylist**
(compra de cartas do cliente) e **crédito de loja**. Um painel
**super-admin** no domínio raiz cuida do provisionamento de tenants.

> ⚠️ **Next.js 16**: este projeto usa a release com `cacheComponents` e
> outras quebras em relação ao Next 15. Antes de editar código, consulte
> `node_modules/next/dist/docs/` em vez de confiar em memória de versões
> anteriores. Veja [AGENTS.md](./AGENTS.md).

---

## Sumário

- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Setup local](#setup-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Como o sistema funciona](#como-o-sistema-funciona)
  - [Multi-tenancy e roteamento](#multi-tenancy-e-roteamento)
  - [Autenticação e papéis](#autenticação-e-papéis)
  - [Domínios funcionais](#domínios-funcionais)
- [Arquitetura](#arquitetura)
  - [Camadas (DDD pragmático)](#camadas-ddd-pragmático)
  - [Modelo de dados](#modelo-de-dados)
  - [DI Container](#di-container)
- [Resiliência e eventos](#resiliência-e-eventos)
- [Webhooks e GDPR](#webhooks-e-gdpr)
- [Cache e performance](#cache-e-performance)
- [Segurança](#segurança)
- [Observabilidade](#observabilidade)
- [Testes](#testes)
- [Documentação adicional](#documentação-adicional)

---

## Stack

| Camada | Tecnologia |
| --- | --- |
| Web framework | **Next.js 16** (App Router, `cacheComponents`) + React 19 |
| Banco | **PostgreSQL** via **Prisma 7** (com **RLS** habilitado) |
| Auth | **Supabase Auth** (`@supabase/ssr`) |
| Cache / rate-limit | **Redis** (ioredis), com fallback in-memory para testes |
| DI | **tsyringe** + `reflect-metadata` |
| UI | **Tailwind 4** + **shadcn** + **base-ui** + **lucide-react** |
| Forms | **react-hook-form** + **zod** |
| Data fetching | **@tanstack/react-query** |
| Charts | **recharts** |
| OpenAPI | **swagger-jsdoc** + `@scalar/nextjs-api-reference` |
| Observabilidade | **Sentry** + **OpenTelemetry** + logger correlacionado |
| Testes | **Vitest** (unit) + **Playwright** (e2e) |

---

## Pré-requisitos

- **Node.js ≥ 20** (ver [.nvmrc](./.nvmrc))
- **PostgreSQL 15+** (ou um projeto Supabase)
- **Redis 6+**

---

## Setup local

```bash
# 1. Dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# preencha DATABASE_URL, DIRECT_URL, SUPABASE_*, REDIS_URL

# 3. Migrações + seed (cria tenants, produtos e dados de demo)
npx prisma migrate dev
npm run db:seed

# 4. Dev server
npm run dev
```

Hosts úteis (o Next aceita subdomínios em `*.localhost`):

| URL | O que é |
| --- | --- |
| `http://localhost:3000` | Landing page + login do super-admin |
| `http://{slug}.localhost:3000` | Storefront público de um tenant |
| `http://{slug}.localhost:3000/admin` | Painel da loja |
| `http://localhost:3000/internal` | Painel super-admin (provisionamento de tenants) |
| `http://localhost:3000/api/docs` | Referência OpenAPI (Scalar) |

---

## Variáveis de ambiente

Resumo do [.env.example](./.env.example):

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | Conexão Postgres (recomenda-se via pooler/PgBouncer) |
| `DIRECT_URL` | Conexão direta (usada por `prisma migrate`) |
| `DB_POOL_MAX` / `DB_POOL_IDLE_MS` / `DB_CONN_TIMEOUT_MS` | Pool do `@prisma/adapter-pg` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (server-only) — admin tasks |
| `REDIS_URL` | Redis para cache + rate-limit + locks |
| `CACHE_STORE` | `redis` ou `memory` (memory é o fallback de teste) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Sentry |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Upload de sourcemaps em CI |

---

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Build de produção (roda `prisma generate` antes) |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint com `--fix` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit) |
| `npm run test:coverage` | Vitest com coverage |
| `npm run test:e2e` | Playwright |
| `npm run db:seed` | Popula o banco com dados de demo |
| `npm run analyze` | Build com `@next/bundle-analyzer` |

Hooks Husky + `lint-staged` rodam ESLint nos arquivos `.ts`/`.tsx` em commit.

---

## Como o sistema funciona

### Multi-tenancy e roteamento

Cada loja é um `Tenant` (modelo Prisma) identificado por **`slug`**.
A separação acontece a partir do **subdomínio** (`{slug}.dominio`) e é
aplicada no [src/proxy.ts](./src/proxy.ts) — o middleware do Next que
intercepta toda request:

1. Gera `nonce` para a CSP
2. Aplica **CSRF** (`Origin`/`Referer` × `Host`) em métodos não-safe
3. Aplica **rate-limit** por IP (políticas por rota em [src/lib/proxy/rate-limit-policy.ts](./src/lib/proxy/rate-limit-policy.ts))
4. Resolve `tenantId` a partir do subdomínio (cache Redis, TTL 60s)
5. Em rotas de auth ou protegidas, valida a sessão Supabase e o
   `app_metadata.tenantId` × subdomínio (bloqueia cross-tenant)
6. Encaminha `x-tenant-id`, `x-correlation-id` e `x-nonce` ao handler
7. Aplica headers de segurança (CSP, HSTS, X-Frame-Options, etc.)

Server Components/Routes leem o tenant pelo helper
[src/lib/tenant-server.ts](./src/lib/tenant-server.ts), que também
encapsula a sessão e o tracing por request. Isso garante que **nenhuma
query de tenant cai sem `tenantId`** no caminho HTTP.

A defesa em profundidade vem do **RLS** ativado na migration
`20260430100000_enable_rls`: o Postgres recusa rows de outro tenant
mesmo que uma query "esqueça" o filtro.

### Autenticação e papéis

Há três perfis, todos no Supabase:

- **SUPER_ADMIN** — opera apenas no domínio raiz (`/internal`).
  Cria/edita tenants. Não tem `tenantId`.
- **TENANT_ADMIN / STAFF** — `app_metadata.tenantId` aponta para o
  tenant. Acessa `{slug}.dominio/admin`.
- **Cliente público** — não autenticado, só usa o storefront.

O proxy redireciona super-admins logados em subdomínio para `/internal`,
e admins logados em outro tenant para `/login?error=tenant_mismatch`.
Login sofre throttle por conta (Redis), conforme migration
`fa56141 fix(security): tenant RLS + per-account login throttle`.

### Domínios funcionais

| Área | Onde fica | O que faz |
| --- | --- | --- |
| **Storefront** | [src/app/(storefront)/](src/app/(storefront)/) | Catálogo público, busca de singles, página de produto, buylist público |
| **PDV (POS)** | [src/app/admin/pos/](src/app/admin/pos/) | Checkout balcão, múltiplos pagamentos, uso de crédito |
| **Pedidos** | [src/app/admin/orders/](src/app/admin/orders/) | Pedidos do e-commerce + POS, status, observações |
| **Estoque** | [src/app/admin/inventory/](src/app/admin/inventory/) | Cartas singles (template + condição + idioma + preço) |
| **Produtos** | [src/app/admin/products/](src/app/admin/products/) | Itens "lacrados" (boosters, decks, acessórios) com categorias |
| **Clientes** | [src/app/admin/customers/](src/app/admin/customers/) | Cadastro, histórico, ranking, crédito |
| **Buylist** | [src/app/admin/buylist/](src/app/admin/buylist/) e [.../buylist-proposal/](src/app/admin/buylist-proposal/) | Lista de cartas que a loja compra; proposta enviada pelo cliente, aprovação interna, pagamento em dinheiro ou crédito |
| **Relatórios** | [src/app/admin/reports/](src/app/admin/reports/) | Dashboard, receita, ranking de produtos, fonte de venda |
| **Settings** | [src/app/admin/settings/](src/app/admin/settings/) | Branding, contatos, webhook URL/secret |
| **Super-admin** | [src/app/internal/](src/app/internal/) | Lista, cria e atualiza tenants e seus admins |

Use-cases vivem em
[src/lib/application/use-cases/](src/lib/application/use-cases/),
um arquivo por caso de uso, agrupados por agregado
(`orders/`, `customers/`, `inventory/`, `products/`, `buylist/`,
`reports/`, `storefront/`, `users/`, `tenant/`, `gdpr/`).

---

## Arquitetura

### Camadas (DDD pragmático)

Dependências apontam **de fora para dentro**: `app` → `application` →
`domain`; `infrastructure` implementa as interfaces de `domain`.

```
src/
├─ app/                       # Rotas Next (App Router)
│  ├─ (storefront)/           # Storefront público
│  ├─ admin/                  # Painel da loja (TENANT_ADMIN/STAFF)
│  ├─ internal/               # Super-admin (root domain)
│  ├─ api/                    # HTTP API
│  │  ├─ admin/               # Mutations da loja
│  │  ├─ storefront/          # Endpoints públicos cacheáveis
│  │  ├─ internal/            # Super-admin: tenants
│  │  ├─ cron/                # drain-outbox, outbox-dlq
│  │  └─ docs/                # OpenAPI (Scalar)
│  ├─ auth/, login/           # Fluxo Supabase
│  └─ layout.tsx, error.tsx
├─ components/                # UI por domínio (admin/storefront/shop/...)
├─ lib/
│  ├─ domain/                 # Núcleo: entidades, repos (interfaces), eventos, erros, services
│  ├─ application/            # Use-cases + handlers de eventos
│  ├─ infrastructure/         # Prisma repos, cache Redis, HTTP helpers, container DI
│  ├─ proxy/                  # Helpers do middleware (subdomínio, rate-limit, IP, headers)
│  ├─ security/               # CSP, CSRF
│  ├─ supabase/               # server/proxy clients, user-metadata
│  ├─ resilience/             # Circuit breaker (Scryfall), retry, locks
│  ├─ observability/          # tracer OTel, métricas
│  ├─ scrapers/               # liga-magic e similares
│  ├─ tenant-server.ts        # Wrapper de auth + tenant + tracing por request
│  └─ super-admin-server.ts   # Idem, mas para o painel super-admin
└─ proxy.ts                   # Middleware (tenant + segurança)
```

### Modelo de dados

Schema completo em [prisma/schema.prisma](./prisma/schema.prisma). Em
linhas gerais:

- **`Tenant`** — loja; carrega branding, contatos, `webhookUrl`/`webhookSecret`.
- **`CardTemplate`** — catálogo global de cartas (compartilhado entre
  tenants). Não tem `tenantId`. Identifica `name + set + game`.
- **`InventoryItem`** — uma "linha" de estoque do tenant: template +
  condição (`NM/SP/MP/HP/D`) + idioma + preço + qty.
- **`Product` / `ProductCategory`** — itens "lacrados" (boosters, decks,
  acessórios) com soft-delete.
- **`Order` / `OrderItem` / `OrderPayment`** — pedido pode ser `POS` ou
  `ECOMMERCE`, status `PENDING/PAID/SHIPPED/CANCELLED`, múltiplos
  pagamentos (cash/card/pix/transfer/store-credit).
- **`Customer`** — cliente da loja. `creditBalance` é o cache do saldo;
  o histórico autoritativo está em `CustomerCreditLedger`.
- **`CustomerCreditLedger`** — append-only com tipo (`CREDIT`/`DEBIT`)
  e `source` (`MANUAL`, `ORDER_PAYMENT`, `ORDER_REFUND`,
  `BUYLIST_PROPOSAL`).
- **`BuylistItem`** — preços (cash/credit) que o tenant paga por cada
  carta.
- **`BuylistProposal` / `BuylistProposalItem`** — proposta de venda do
  cliente para a loja (`PENDING → RECEIVED → APPROVED → PAID`); pagar
  em crédito gera lançamento na ledger.
- **`OutboxEvent`** — outbox transacional (ver
  [Resiliência e eventos](#resiliência-e-eventos)).
- **`AuditLog`** — append-only para `DELETE/UPDATE/CREATE/RESTORE` em
  operações sensíveis (deletes, mudanças de papel, ajuste de crédito).

Pontos importantes do schema:

- Dinheiro em `Decimal(12,2)` e há check-constraint de não-negativo
  (`20260428180000_money_precision_check_and_indexes`).
- Soft-delete via `deletedAt` em `Product`, `ProductCategory`, `Customer`.
- Índices compostos por `tenantId` + status/data nos agregados quentes
  (orders, ledger, audit).
- `RLS` ativo (`20260430100000_enable_rls`).

### DI Container

`tsyringe` com tokens simbólicos em
[src/lib/infrastructure/tokens.ts](./src/lib/infrastructure/tokens.ts).
Bindings em
[src/lib/infrastructure/container.ts](./src/lib/infrastructure/container.ts):

- Repositórios Prisma como **singletons**.
- `ICacheService` resolvido por factory (Redis ou in-memory conforme
  `CACHE_STORE`).
- `registerEventHandlers()` é chamado no boot do container — assina os
  domain events nos handlers de aplicação.

Para adicionar um repositório novo:

1. Defina a interface em `domain/repositories/`.
2. Implemente em `infrastructure/repositories/` (Prisma).
3. Adicione token em `tokens.ts`.
4. Registre no `container.ts`.
5. Use-cases recebem via `@inject(TOKENS.XRepository)`.

Server Components/Routes resolvem use-cases com `container.resolve(...)`.
**Não** instancie repositórios direto nas rotas.

---

## Resiliência e eventos

O sistema usa o **outbox pattern** para entregas at-least-once de
eventos cross-aggregate (ex: `order.placed` → atualizar estoque,
invalidar cache, enviar webhook, registrar audit).

Fluxo:

1. Use-case insere a row em `outbox_events` **dentro da mesma
   transação** que muda o estado de negócio. Se a transação não
   commitar, nada é publicado — sem fantasmas.
2. Cron `/api/cron/drain-outbox` ([src/app/api/cron/drain-outbox/](src/app/api/cron/drain-outbox/))
   lê eventos com `processed_at IS NULL`, chama os handlers em
   [src/lib/application/events/](src/lib/application/events/), e estampa
   `processed_at`. Falhas incrementam `attempts` e gravam `last_error`.
3. Após `MAX_ATTEMPTS`, o evento vai para **DLQ** (`dead_lettered_at`
   preenchido). `/api/cron/outbox-dlq` é o endpoint de inspeção/replay.

Handlers atuais:

- `cache-handlers.ts` — invalida tags React Cache ao mutar dados.
- `inventory-event-handlers.ts` — debita estoque ao confirmar pedido.
- `customer-credit-handlers.ts` — registra ledger ao usar/devolver crédito.
- `audit-handlers.ts` — escreve em `audit_logs`.
- `notification-handlers.ts` — toasts/UI.
- `webhook-handlers.ts` — entrega webhooks assinados (ver abaixo).

Outras camadas de resiliência em [src/lib/resilience/](src/lib/resilience/):

- **Circuit breaker** para chamadas ao Scryfall (`c109487 …`), evita
  inundar a integração externa quando ela está degradada.
- **Locks** Redis para serializar operações por tenant/recurso.
- **Retry** com backoff exponencial para falhas transitórias.

---

## Webhooks e GDPR

**Webhooks por tenant** (`d4ff381 feat(saas): GDPR endpoints + signed
outbound webhooks per tenant`):

- Cada tenant tem `webhookUrl` + `webhookSecret` (HMAC-SHA256).
- Eventos como `order.placed` são empacotados, assinados e entregues
  pelo handler `webhook-handlers.ts`. Falhas seguem a mesma política
  do outbox.
- O secret é rotacionado pela tela de Settings.

**GDPR**: use-cases em [src/lib/application/use-cases/gdpr/](src/lib/application/use-cases/gdpr/):

- `export-customer.use-case.ts` — exporta todos os dados de um cliente
  (perfil, ordens, pagamentos, ledger, propostas de buylist).
- `erase-customer.use-case.ts` — apagamento sob direito ao esquecimento
  (anonimização preservando integridade contábil).

---

## Cache e performance

- **`ICacheService`** ([src/lib/infrastructure/cache/](src/lib/infrastructure/cache/))
  — abstração com implementações Redis e in-memory; usada para
  resolução de tenant (TTL 60s), rate-limit, e caches de leitura.
- **HTTP caching** em endpoints de leitura do storefront
  (`bb7983a feat(perf): HTTP caching on storefront read endpoints`):
  `Cache-Control` + `ETag` + revalidação por tags do React Cache.
- **Tags** em [src/lib/cache-tags.ts](./src/lib/cache-tags.ts) ligam
  domínio (ex: `inventory:{tenantId}`) à invalidação no React Cache.

---

## Segurança

- **CSP** com nonce por request (`strict-dynamic`) — gerado no proxy.
- **CSRF** por same-origin em `POST/PUT/PATCH/DELETE`.
- **Rate-limit** por IP em `/api/*` (políticas por rota) + por conta
  no login.
- **Headers** endurecidos em [next.config.ts](./next.config.ts) (HSTS,
  X-Frame-Options, Referrer-Policy, etc.).
- **Postgres RLS** com policies por `tenant_id`.
- **Auditoria** append-only de operações sensíveis.
- **Webhooks** assinados com HMAC; secret nunca é logado.

Para revisar mudanças em PRs, há uma skill de revisão de segurança
disponível na CLI (rode `/security-review`).

---

## Observabilidade

- **Sentry** inicializado em [src/instrumentation.ts](src/instrumentation.ts).
- **OpenTelemetry**: spans para handlers (`tenant.handler`,
  `super-admin.handler`, etc.) com atributos como `tenant.id` e
  `user.id` ([src/lib/observability/tracer.ts](src/lib/observability/tracer.ts)).
- **Logger** em [src/lib/logger.ts](src/lib/logger.ts) com
  `correlation-id` propagado via `AsyncLocalStorage`
  ([src/lib/correlation-context.ts](src/lib/correlation-context.ts)). O
  proxy aceita um `x-correlation-id` upstream para amarrar logs
  ponta-a-ponta.

---

## Testes

- **Unit** (Vitest) — `tests/unit/...`. Foco em use-cases,
  serviços de domínio e helpers de proxy. Repositórios são testados
  com mocks/stubs e o cache usa `MemoryCacheService`.
- **E2E** (Playwright) — `tests/e2e/...`. Configuração em
  [playwright.config.ts](./playwright.config.ts).
- **Coverage** com `@vitest/coverage-v8`.

```bash
npm test                # unit
npm run test:coverage   # unit + coverage
npm run test:e2e        # browser
```

---

## Documentação adicional

Toda a documentação técnica vive em [docs/](./docs/) — comece pelo
[índice](./docs/README.md). Mapa rápido:

| Tópico | Documento |
| --- | --- |
| Camadas DDD, DI, convenções | [docs/architecture.md](./docs/architecture.md) |
| Subdomínios, RLS, super-admin | [docs/multi-tenancy.md](./docs/multi-tenancy.md) |
| Modelo de dados | [docs/data-model.md](./docs/data-model.md) |
| Superfície HTTP / OpenAPI | [docs/api.md](./docs/api.md) |
| Outbox + handlers + DLQ | [docs/events-and-outbox.md](./docs/events-and-outbox.md) |
| Webhooks (HMAC, breaker, retry) | [docs/webhooks.md](./docs/webhooks.md) |
| Segurança | [docs/security.md](./docs/security.md) |
| Cache (Redis + React Cache + HTTP) | [docs/cache.md](./docs/cache.md) |
| Observabilidade | [docs/observability.md](./docs/observability.md) |
| Resiliência | [docs/resilience.md](./docs/resilience.md) |
| Testes | [docs/testing.md](./docs/testing.md) |
| Setup local detalhado | [docs/development.md](./docs/development.md) |

ADRs em [docs/adr/](./docs/adr/):
[0001 DDD](./docs/adr/0001-ddd-layering.md) ·
[0002 Multi-tenancy](./docs/adr/0002-multi-tenancy-by-subdomain.md) ·
[0003 Outbox](./docs/adr/0003-outbox-pattern.md) ·
[0004 RLS](./docs/adr/0004-postgres-rls-defense-in-depth.md) ·
[0005 Webhooks](./docs/adr/0005-tenant-webhooks-hmac.md).

Outros pontos de entrada:

- [AGENTS.md](./AGENTS.md) — orientações para qualquer agente/IA
  trabalhando neste repositório (Next 16 não é o que você lembra).
- `/api/docs` — referência OpenAPI viva (Scalar).
