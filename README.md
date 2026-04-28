# TCG Shop SaaS

Plataforma multi-tenant para lojas de TCG (Magic, Pokémon, Yu-Gi-Oh!) com
PDV, catálogo online, gestão de estoque, clientes, pedidos, crédito de loja
e buylist.

## Stack

- **Next.js 16** (App Router, cacheComponents) + React 19
- **Prisma 7** + PostgreSQL (Supabase)
- **Supabase Auth** (sessões server-side via `@supabase/ssr`)
- **Redis** (ioredis) para cache e rate limiting
- **tsyringe** para injeção de dependência
- **Tailwind 4** + shadcn + base-ui
- **Sentry** para observabilidade
- **Vitest** (unit) + **Playwright** (e2e)

## Pré-requisitos

- Node.js ≥ 20 (ver [.nvmrc](./.nvmrc))
- PostgreSQL 15+ (ou projeto Supabase)
- Redis 6+

## Setup

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente
cp .env.example .env
# preencher DATABASE_URL, SUPABASE_*, REDIS_URL

# 3. Migrações + seed
npx prisma migrate dev
npm run db:seed

# 4. Dev server
npm run dev
```

Acessar:
- Landing: `http://localhost:3000`
- Storefront de um tenant: `http://{slug}.localhost:3000`
- Admin: `http://{slug}.localhost:3000/admin`

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Next dev server |
| `npm run build` | Build de produção (roda `prisma generate`) |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint com `--fix` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unit) |
| `npm run test:coverage` | Vitest com coverage |
| `npm run test:e2e` | Playwright |
| `npm run db:seed` | Popula o banco com dados de demo |

## Arquitetura

Organização por camadas seguindo DDD:

```
src/
  app/              # Rotas Next (App Router)
    (storefront)/   # Rotas públicas do tenant
    admin/          # Painel interno
    api/            # Rotas HTTP
  components/       # UI por domínio (admin, storefront, shop, landing, ui)
  lib/
    domain/         # Entidades, eventos, erros, repositórios (interfaces), serviços
    application/    # Use-cases + handlers de eventos
    infrastructure/ # Implementações concretas (Prisma, Redis, HTTP helpers)
    security/       # CSP, CSRF
    supabase/       # Clients server/proxy
  proxy.ts          # Middleware (tenant, rate-limit, CSRF, auth)
```

O DI é configurado em [src/lib/infrastructure/container.ts](./src/lib/infrastructure/container.ts)
e os tokens em [src/lib/infrastructure/tokens.ts](./src/lib/infrastructure/tokens.ts).

Para mais detalhes veja [docs/](./docs).

## Multi-tenancy

Cada loja é um `Tenant` identificado por `slug`. O proxy
([src/proxy.ts](./src/proxy.ts)) resolve o subdomínio para `tenantId` e
propaga via header `x-tenant-id`. O contexto é acessado em server code
através de [src/lib/tenant-server.ts](./src/lib/tenant-server.ts).

Usuários admin têm `tenantId` em `app_metadata` do Supabase; o proxy
bloqueia cross-tenant.

## Segurança

- CSP com nonce por request (`strict-dynamic`)
- CSRF via same-origin em métodos não-safe (`POST`/`PUT`/`PATCH`/`DELETE`)
- Rate limiting por IP em `/api/*`
- Headers HTTP endurecidos em [next.config.ts](./next.config.ts)

## Nota sobre Next.js 16

Este projeto está em Next 16, que traz mudanças **breaking** em relação ao
Next 15. Ao editar código, consulte `node_modules/next/dist/docs/` para a
API correta — não confie em memória muscular de versões anteriores.
