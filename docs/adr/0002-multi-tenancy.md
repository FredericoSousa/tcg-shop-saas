# ADR 0002 — Multi-tenancy por subdomínio

- **Status:** aceito
- **Data:** 2026-04-10

## Contexto

Cada loja precisa de sua própria URL, branding e isolamento de dados.
Alternativas consideradas:

1. Subdomínio (`loja.app.com`) — escolhido
2. Path prefix (`app.com/loja/...`)
3. Domínio custom por tenant

## Decisão

- Resolver `tenant` pelo subdomínio no middleware (`src/proxy.ts`).
- Cachear `slug → tenantId` no Redis (TTL 60s) para evitar hit no DB a
  cada request.
- Propagar `tenantId` via header `x-tenant-id`; Server Components leem
  via `tenant-server.ts`.
- Usuários do painel têm `tenantId` em `app_metadata` (Supabase);
  proxy rejeita cross-tenant com `signOut`.

## Consequências

- Todo repositório deve filtrar por `tenantId`. Não há Row-Level Security
  no Postgres — o isolamento é **responsabilidade da aplicação**.
- Domínios custom por tenant ficam para uma ADR futura.
- O domínio público do storefront precisa wildcard DNS (`*.app.com`).
