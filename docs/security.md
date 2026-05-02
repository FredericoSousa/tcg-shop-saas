# Segurança

Defesa em camadas. Nenhuma única peça é a "última linha" — cada uma
existe para conter o defeito da próxima.

## CSP com nonce por request

[`src/lib/security/csp.ts`](../src/lib/security/csp.ts) gera um nonce
único a cada request no proxy. A response carrega
`Content-Security-Policy` com `script-src 'self' 'nonce-<n>'
'strict-dynamic'`. Server Components recebem o nonce via header
`x-nonce` e o aplicam aos `<script>` que precisarem.

`strict-dynamic` permite que scripts assinados pelo nonce carreguem
outros scripts em runtime — necessário para o React 19 + bundler do
Next 16.

## CSRF por same-origin

[`src/lib/security/csrf.ts`](../src/lib/security/csrf.ts). Em métodos
não-safe (`POST/PUT/PATCH/DELETE`), o proxy compara `Origin` (e cai
em `Referer` se ausente) com `Host`. Mismatch → 403
`CSRF_ORIGIN_MISMATCH`.

Razão de não usar token CSRF: o Supabase já usa cookies httpOnly e o
storefront/admin são same-origin. Same-origin check é suficiente e
barato.

## Rate-limit

Implementação em [`src/lib/rate-limiter.ts`](../src/lib/rate-limiter.ts)
(token bucket no Redis com fallback in-memory). Políticas em
[`src/lib/proxy/rate-limit-policy.ts`](../src/lib/proxy/rate-limit-policy.ts):

| Bucket | Match | Limite |
| --- | --- | --- |
| `auth:{ip}` | `/api/auth/*`, `/login` | 10 / 60s |
| `checkout:{ip}` | `/api/checkout/*` | 15 / 60s |
| `api:{ip}` | demais `/api/*` | 60 / 60s |

Quando excedido: 429 com `Retry-After`, `X-RateLimit-Limit`,
`X-RateLimit-Remaining`.

### Login throttle por conta

Adicional ao rate-limit por IP. Falhas repetidas para o mesmo email
(independente do IP) ativam bloqueio temporário. Mitiga ataques
distribuídos.

## RLS no Postgres

Defesa em profundidade contra "esqueci o `where: { tenantId }`".
Migration `20260430100000_enable_rls`.

- Toda tabela com `tenant_id` tem RLS **habilitado e forçado**
  (`FORCE ROW LEVEL SECURITY`).
- Policy `tenant_isolation` casa por GUC `app.tenant_id` (ou
  `app.bypass_rls = 'on'` para workers cross-tenant).
- A extensão Prisma envolve cada query numa transação que executa
  `SELECT set_config(...)` antes — `set_config(..., true)` é
  transaction-local, compatível com PgBouncer transaction mode.

Detalhes em [multi-tenancy.md](./multi-tenancy.md#rls-defesa-em-profundidade)
e [ADR 0004](./adr/0004-postgres-rls-defense-in-depth.md).

## Auditoria

Tabela `audit_logs` (append-only). Mutations sensíveis emitem evento
`audit.*` que o `audit-handlers.ts` materializa no banco com
`actorId`, `action`, `entityType`, `entityId` e `metadata`. Cobre:

- Deletes de produto/cliente/categoria.
- Mudanças de papel ou de admin do tenant.
- Ajustes manuais de crédito.
- Atualização de webhook.

Retenção é responsabilidade de cron de infra (ainda não
implementado) — nunca atualizar/deletar manualmente.

## Auth e papéis

Supabase Auth com `app_metadata`:

- `role`: `SUPER_ADMIN | TENANT_ADMIN | STAFF`.
- `tenantId`: presente em `TENANT_ADMIN`/`STAFF`, ausente em
  `SUPER_ADMIN`.

Helpers em [`src/lib/supabase/user-metadata.ts`](../src/lib/supabase/user-metadata.ts).
O proxy bloqueia cross-tenant (compare com subdomínio) e impede
super-admin de operar dentro de um tenant (redireciona para
`/internal`).

Cookies de auth são httpOnly + Secure em produção. O proxy limpa
cookies localmente em caso de mismatch para evitar round-trip ao
Supabase (poupa 100-300ms).

## Webhooks (saída)

- Assinados com HMAC-SHA256 (`{timestamp}.{body}` keyed pelo secret).
- Secret per-tenant, rotacionado via Settings, nunca logado.
- Detalhes em [webhooks.md](./webhooks.md).

## Outras

- Headers endurecidos em [`next.config.ts`](../next.config.ts): HSTS,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `X-Content-Type-Options: nosniff`, `Permissions-Policy`.
- Inputs validados com **Zod** na borda (rota) e no use-case quando
  representa regra de domínio.
- Money em `Decimal(12,2)` com check de não-negativo no banco
  (mitigação de underflow / preço negativo).
- Nenhum segredo em URL (`SUPABASE_SERVICE_ROLE_KEY`,
  `SENTRY_AUTH_TOKEN`, etc.) — só env, server-only.
- `NEXT_PUBLIC_*` é a única exceção (vai para o bundle do client) e
  só transporta o que já é público (URL Supabase, anon key, Sentry
  DSN público).

## Skill `/security-review`

A CLI tem um skill que faz revisão de segurança da branch atual.
Para PRs com mudanças sensíveis (auth, RLS, webhooks, novos
endpoints), rode antes de fazer merge.
