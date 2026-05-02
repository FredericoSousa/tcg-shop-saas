# ADR 0002 — Multi-tenancy por subdomínio

- **Status:** aceito
- **Data:** 2026-04-10
- **Atualizado:** 2026-04-30 (adoção de RLS — ver [ADR 0004](./0004-postgres-rls-defense-in-depth.md))

## Contexto

Cada loja precisa de URL própria, branding próprio e isolamento
completo de dados. Alternativas:

1. **Subdomínio** (`loja.app.com`).
2. **Path prefix** (`app.com/loja/...`).
3. **Domínio custom por tenant** (`lojadojoao.com.br`).

## Decisão

- Resolver o tenant pelo subdomínio no middleware
  ([`src/proxy.ts`](../../src/proxy.ts)).
- Cachear `slug → tenantId` no Redis (TTL 60s) para evitar hit no DB
  a cada request.
- Propagar `tenantId` via header `x-tenant-id`. Server Components
  leem via `tenant-server.ts`; rotas de API via wrappers
  `withTenantApi` / `withSuperAdminApi`.
- Usuários do painel têm `tenantId` em `app_metadata` (Supabase). O
  proxy bloqueia cross-tenant limpando cookies localmente
  (mais rápido que `signOut` round-trip).

### Isolamento em camadas

A versão original deste ADR descansava o isolamento **só** na
aplicação. A revisão adicionou:

1. Extensão do Prisma que **auto-injeta** `where: { tenantId }` em
   modelos com `tenant_id` (e `data: { tenantId }` em creates).
2. **Postgres RLS** com policies por GUC (`app.tenant_id`,
   `app.bypass_rls`) — ver [ADR 0004](./0004-postgres-rls-defense-in-depth.md).

Cada camada existe para conter falhas das outras.

## Consequências

**Positivas**

- URLs limpas e marketing-friendly.
- Domínio público do storefront precisa apenas wildcard DNS
  (`*.app.com`) + cert wildcard.
- Esquecer `tenantId` numa query Prisma agora **falha** em vez de
  vazar dados.

**Negativas**

- Domínios custom por tenant ficam para uma ADR futura (resolver
  precisa virar host-aware, não só subdomain-aware).
- Browsers nem sempre resolvem `*.localhost` (Safari não) — guia em
  [development.md](../development.md) cobre.

## Alternativas rejeitadas

- **Path prefix**: branding fica preso à mesma URL raiz; cookies
  cruzam tenants (mesma origin); não suporta domínio custom no
  futuro sem reescrever quase tudo.
- **Domínio custom por tenant agora**: complexidade de DNS + certs
  + onboarding sem necessidade de produto comprovada. Possível adicionar
  depois sobre o resolver atual.
