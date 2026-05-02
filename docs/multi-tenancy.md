# Multi-tenancy

Cada loja é um `Tenant` (modelo Prisma) com **`slug`** único. A
separação acontece a partir do **subdomínio**, e o isolamento é
aplicado em **três camadas independentes**, cada uma capaz de
conter um defeito da outra.

## Pipeline (proxy/middleware)

[`src/proxy.ts`](../src/proxy.ts) intercepta toda request:

1. **Nonce CSP** gerado por request (`generateNonce()`).
2. **CSRF**: em métodos não-safe (`POST/PUT/PATCH/DELETE`) compara
   `Origin`/`Referer` contra `Host`. Bloqueia 403 com
   `CSRF_ORIGIN_MISMATCH`.
3. **Rate-limit**: políticas em
   [`src/lib/proxy/rate-limit-policy.ts`](../src/lib/proxy/rate-limit-policy.ts).
   Buckets por IP no Redis:
   - `/api/auth/*` e `/login` → 10 / 60s
   - `/api/checkout/*` → 15 / 60s
   - `/api/*` → 60 / 60s
4. **Resolução de tenant**: `extractSubdomain(host)` →
   `resolveTenantId(slug)` que consulta Redis (`tenant:slug:{slug}`,
   TTL 60s) e cai em DB se cache miss. Erros não derrubam a request
   — em DB miss o `tenantId` fica `null` e quem precisar exige
   contexto vai falhar adiante.
5. **Auth-sensitive paths** (`/admin`, `/internal`, `/api/internal`,
   `/login`, `/auth/*`) abrem o `createSupabaseProxyClient` para ler
   o usuário e:
   - Em **`/internal`**: exige domínio raiz (sem tenant), exige login,
     exige `app_metadata.role === "SUPER_ADMIN"` (senão limpa cookies
     e manda para `/login?error=forbidden`).
   - Em **`/admin`**: exige login. Super-admins logados em subdomínio
     são jogados para `/internal`. Mismatch entre `app_metadata.tenantId`
     e o subdomínio limpa cookies e manda para
     `/login?error=tenant_mismatch` (sem round-trip ao Supabase para
     poupar 100-300ms).
   - Em **`/login`** com usuário já autenticado: redireciona para o
     destino certo (`/internal` para super-admin, `/admin` se já está
     no tenant correto).
6. **Forward headers** com `x-nonce`, `x-correlation-id`, `x-tenant-id`.
   `x-correlation-id` honra o valor inbound (gateway/upstream tracing)
   ou gera novo.
7. **Security headers** aplicados na response (CSP, HSTS, etc.).

O matcher exclui `_next/static`, `_next/image`, `favicon.ico` e `public`.

## Contexto de tenant em server code

[`src/lib/tenant-server.ts`](../src/lib/tenant-server.ts) é o wrapper
de borda usado por todo Server Component, Server Action e Route
Handler do `/admin`:

- Lê `x-tenant-id` e `x-correlation-id` dos headers do request.
- Carrega a sessão Supabase, exige `app_metadata.tenantId === tenantId`.
- Roda o handler dentro de `runWithCorrelationId()` e `withSpan()`.
- Traduz `DomainError` / `ZodError` para `ApiResponse.*`.

[`src/lib/super-admin-server.ts`](../src/lib/super-admin-server.ts) é
o equivalente para `/internal`: não exige tenant; exige `role` =
`SUPER_ADMIN`.

## Auto-injeção de tenantId no Prisma

[`src/lib/prisma.ts`](../src/lib/prisma.ts) estende o `PrismaClient`
com `$extends({ query: { $allModels: { $allOperations } } })`. Para
modelos com `tenant_id`:

- Em `find*`, `count`, `aggregate`, `groupBy` → injeta
  `where.tenantId` automaticamente.
- Em `create`/`createMany` sem `tenantId`/`tenant` no `data` → injeta.
- Em `update*`, `delete*`, `upsert` → injeta filtro e (no upsert) o
  `data.create`.

O `tenantId` vem de `resolveTenantId()` em
[`src/lib/tenant-context.ts`](../src/lib/tenant-context.ts), que lê
do `AsyncLocalStorage` ou do header `x-tenant-id` no request atual.

Se uma operação não tem tenant **nem** bypass, a query roda como está
— modelos sem `tenant_id` (como `tenants`, `card_templates`) não
precisam de filtro.

## RLS (defesa em profundidade)

Migration `20260430100000_enable_rls`. Toda tabela com `tenant_id`
tem RLS habilitado **e forçado** (`FORCE ROW LEVEL SECURITY` — sem
isso o owner do schema bypassa RLS por padrão e a defesa é fictícia).

Política `tenant_isolation` (USING + WITH CHECK):

```sql
current_setting('app.bypass_rls', true) = 'on'
OR tenant_id::text = current_setting('app.tenant_id', true)
```

A extensão Prisma envolve cada operação numa transação que executa
`SELECT set_config('app.tenant_id', $tenantId, true)` (ou
`'app.bypass_rls' = 'on'`) **antes** da query — `set_config(..., true)`
é transaction-local, então morre com a tx. Compatível com PgBouncer
em modo transaction.

Tabelas cobertas: `inventory_items`, `product_categories`, `products`,
`orders`, `customers`, `customer_credit_ledger`, `buylist_items`,
`buylist_proposals`. Tabelas filhas (`order_items`, `order_payments`,
`buylist_proposal_items`) ficam fora da policy direta — herdam
isolamento via FK do parent.

## Bypass intencional

`withRLSBypass(fn)` em `src/lib/prisma.ts` é a única porta legítima:

- **outbox drainer** ([`outbox-worker.ts`](../src/lib/application/events/outbox-worker.ts))
  precisa ler eventos de todos os tenants.
- **lookup de tenant pelo slug** acontece *antes* de a request entrar
  num contexto de tenant.
- **fluxo de login** pode precisar achar o tenant para decidir o
  redirect.

Toda chamada a `withRLSBypass` deve ter um motivo explícito num
comentário no código.

## Papéis

Tudo no Supabase Auth, `app_metadata`:

| Role | Onde opera | `tenantId` |
| --- | --- | --- |
| `SUPER_ADMIN` | `/internal` no domínio raiz | ausente |
| `TENANT_ADMIN` | `{slug}/admin` | obrigatório, bate com o subdomínio |
| `STAFF` | idem | idem |
| (não autenticado) | storefront público | n/a |

## Login throttle por conta

Além do rate-limit por IP no `/login`, há throttle **por conta**
(commit `fa56141`): N tentativas falhas → bloqueio temporário com
chave Redis `login:throttle:{email}`. Mitiga ataque distribuído onde
o IP varia mas o alvo é a mesma conta.

## Domínios custom

Não suportado hoje. Quando virar requisito, abrir um ADR — o resolver
em [`tenant-resolver.ts`](../src/lib/proxy/tenant-resolver.ts) já é
o ponto único de extensão (matchear hostname inteiro além de
subdomínio).
