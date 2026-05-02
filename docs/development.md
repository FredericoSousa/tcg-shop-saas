# Desenvolvimento local

Detalhes além do setup básico do [README](../README.md).

## Pré-requisitos

- **Node.js ≥ 20** (ver `.nvmrc`).
- **PostgreSQL 15+** com extensão `pgcrypto` para `gen_random_uuid()`.
  Supabase já vem com.
- **Redis 6+** (qualquer instância local serve).
- **npm** (lockfile é `package-lock.json`).

## Setup do zero

```bash
npm install
cp .env.example .env
# preencha o .env (DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, REDIS_URL)

npx prisma migrate dev   # roda migrations + gera client
npm run db:seed          # popula com tenants e dados de demo
npm run dev
```

`prisma generate` roda automaticamente em `prebuild` e `pretest`.

## Subdomínios em `*.localhost`

Browsers modernos resolvem `*.localhost` para `127.0.0.1`
automaticamente — não precisa mexer no `/etc/hosts`. Acesse:

| URL | O que é |
| --- | --- |
| `http://localhost:3000` | Landing + login do super-admin |
| `http://demo.localhost:3000` | Storefront do tenant `demo` (criado pelo seed) |
| `http://demo.localhost:3000/admin` | Painel da loja `demo` |
| `http://localhost:3000/internal` | Painel super-admin |
| `http://localhost:3000/api/docs` | Referência OpenAPI |

Se quiser usar Safari, ele **não** resolve `*.localhost` — adicione
no `/etc/hosts`:

```
127.0.0.1  demo.localhost outraloja.localhost
```

## Bootstrap de super-admin

O seed cria tenants e clientes de demo, mas **não** cria usuários do
Supabase. Você precisa:

1. Criar usuário no painel do Supabase.
2. No SQL editor do Supabase:

```sql
update auth.users
   set raw_app_meta_data = jsonb_set(
     coalesce(raw_app_meta_data, '{}'::jsonb),
     '{role}', '"SUPER_ADMIN"'
   )
 where email = 'voce@exemplo.com';
```

Para criar TENANT_ADMIN: idem com `role: TENANT_ADMIN` e
`tenantId: <uuid>`. Em produção, isso é feito pelo super-admin via
`/internal/tenants/<id>/admin`.

## Reset rápido do banco

```bash
npx prisma migrate reset   # dropa, aplica migrations, roda seed
```

Cuidado em ambientes que não sejam estritamente locais.

## Variáveis úteis em dev

| Var | Efeito |
| --- | --- |
| `CACHE_STORE=memory` | Pula Redis, usa cache em memória (útil sem Redis local) |
| `NODE_ENV=development` | Sentry/OTel ficam quietos se DSN/exporters não setados |
| `SENTRY_DSN=` (vazio) | Desativa Sentry |

## Hooks Husky

Husky + `lint-staged` rodam `eslint --fix` em `*.ts`/`*.tsx` no
`pre-commit`. Para pular **com motivo**, peça revisão antes — `--no-verify`
é desencorajado.

## Bundle analyzer

```bash
npm run analyze
```

Abre o `@next/bundle-analyzer` após o build. Útil quando algum chunk
estoura.

## Erros comuns

- **`relation "tenants" does not exist`** → faltou
  `npx prisma migrate dev`.
- **`tenantId is undefined`** ao chamar use-case fora de request →
  envolva em `withRLSBypass()` (worker / job) ou simule contexto via
  `runWithTenantContext` em test.
- **Subdomínio não resolve no Safari** → use Chrome/Firefox ou edite
  `/etc/hosts`.
- **CSP bloqueia script inline** em dev → todo `<script>` precisa do
  `nonce` propagado pelo header `x-nonce`. Server Components leem via
  `headers()`.
- **Login redireciona pra `/login?error=tenant_mismatch`** → o usuário
  está logado num tenant diferente do subdomínio. Limpe cookies ou
  ajuste `app_metadata.tenantId`.

## Workflow recomendado

1. Crie branch a partir de `main`.
2. Mude código + testes.
3. `npm run typecheck && npm run lint && npm test`.
4. Em UI: `npm run dev` e teste o golden path no browser.
5. PR. Para mudanças de auth/RLS/webhooks rode também
   `/security-review`.
