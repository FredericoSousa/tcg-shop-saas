<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent guide — TCG Shop SaaS

Quick orientation for any AI/automation working in this repo. Pair this
with [docs/](./docs/) (deeper material) and [README.md](./README.md)
(setup).

## What this codebase is

Multi-tenant SaaS for TCG card shops (Magic / Pokémon / Yu-Gi-Oh!).
Each shop is a `Tenant` reachable at `{slug}.domain` with its own
storefront, POS, admin panel, inventory, customers, buylist, store
credit. A super-admin panel at `/internal` (root domain) provisions
tenants.

Stack: **Next.js 16** (App Router, `cacheComponents`) + React 19,
Prisma 7 + Postgres (with RLS), Supabase Auth, Redis (ioredis), tsyringe
for DI, Tailwind 4 + shadcn + base-ui, Sentry + OpenTelemetry, Vitest +
Playwright.

## Hard rules — break these and review will reject

1. **Respect the layer boundaries.** `domain` has zero framework deps.
   `application` orchestrates use-cases. `infrastructure` is the only
   place with Prisma/Redis/Supabase. `app/` (Next) consumes use-cases
   via the container. Never import Prisma in a use-case or in a route
   handler — go through a repository.
2. **Never instantiate `PrismaClient`** outside `src/lib/prisma.ts`. Use
   the exported singleton via repositories.
3. **Never call `prisma.X.create/update/delete` directly from a route.**
   Resolve the use-case from the container.
4. **Tenant scoping is automatic — don't fight it.** The Prisma
   extension auto-injects `tenantId` for tenant-aware models. Don't
   pass `tenantId` manually when you're already inside a tenant
   request context. Adding it manually with the wrong value is the
   most common source of cross-tenant bugs.
5. **`withRLSBypass(...)` requires a comment explaining why.** The
   only legit cases: outbox drainer, tenant lookup before context,
   login flow. Anything else needs ADR-level justification.
6. **Mutations with side-effects use the outbox**, not the in-process
   bus directly. Insert into `outbox_events` inside the same
   transaction that mutates business state. See
   [docs/events-and-outbox.md](./docs/events-and-outbox.md).
7. **Money is `Decimal(12, 2)`**, never `number`/`Float`. There are DB
   check constraints for non-negative on monetary columns — preserve
   them in new migrations.
8. **No `console.log` in production code.** Use `logger` from
   `src/lib/logger.ts` so correlation-id and tenantId are attached.
9. **No new `*.md` files** unless explicitly asked. Don't write
   planning/decision/analysis docs as a side-effect of a task.
10. **Don't add backwards-compat shims** (renamed `_unused`, `// removed`
    comments, re-exports for deleted things). If something is unused,
    delete it.

## Project layout (cheat sheet)

```
src/
├─ app/
│  ├─ (storefront)/        public storefront on tenant subdomain
│  ├─ admin/               tenant admin panel (TENANT_ADMIN/STAFF)
│  ├─ internal/            super-admin panel (root domain only)
│  ├─ api/                 HTTP routes (admin, storefront, internal, cron, …)
│  ├─ auth/, login/        Supabase auth flow
│  └─ layout.tsx, error.tsx, not-found.tsx
├─ components/             UI by domain (admin/storefront/shop/internal/…)
├─ lib/
│  ├─ domain/              entities, repos (interfaces), events, errors, services
│  ├─ application/         use-cases + event handlers
│  ├─ infrastructure/      Prisma repos, cache (Redis/memory), HTTP helpers, container
│  ├─ proxy/               middleware helpers (tenant resolver, rate-limit policy, …)
│  ├─ security/            CSP, CSRF
│  ├─ supabase/            server/proxy clients, user-metadata
│  ├─ resilience/          circuit breaker, retry, locks
│  ├─ observability/       OTel tracer
│  ├─ prisma.ts            Prisma client + tenant auto-injection + RLS GUC
│  ├─ tenant-server.ts     edge wrapper for /admin
│  └─ super-admin-server.ts  edge wrapper for /internal
├─ proxy.ts                middleware
└─ instrumentation.ts      Sentry init
prisma/                    schema.prisma + migrations + seed.ts
docs/                      architecture, multi-tenancy, security, ADRs, …
tests/{unit,e2e}/          Vitest and Playwright
```

## How a request flows

1. `src/proxy.ts` — nonce, CSRF, rate-limit, tenant resolution, auth
   for `/admin` and `/internal`, security headers.
2. Route handler / Server Component reads `x-tenant-id`,
   `x-correlation-id`, `x-nonce` from headers.
3. Wraps body in `withTenantApi` / `withSuperAdminApi` /
   `withErrorHandling` (auth + tracing + error translation).
4. Resolves use-case via `container.resolve(UseCase)`.
5. Use-case calls repos. Prisma extension auto-scopes by tenant and
   sets `app.tenant_id` GUC for RLS.
6. On mutation with side-effects, use-case writes to `outbox_events`
   inside the same tx.
7. Cron drains outbox → handlers fire (cache invalidation, audit,
   webhooks, etc.).

## Common gotchas

- **Next 16 ≠ Next 15.** APIs (`cacheComponents`, `cookies()`,
  `headers()`, route segments, `revalidateTag`) have changed. Always
  check `node_modules/next/dist/docs/` instead of going on memory.
- **`*.localhost` in Safari**: doesn't auto-resolve. Use Chrome/Firefox
  or edit `/etc/hosts`.
- **Forgetting RLS context**: if you build a worker that runs outside
  a request, queries to tenant-aware tables return 0 rows. Wrap in
  `withRLSBypass(fn)` (with a justifying comment) or set tenant
  context explicitly.
- **Adding a new tenant-aware Prisma model**: update
  `tenantAwareModels` in `src/lib/prisma.ts` AND add an RLS migration
  (enable + force + policy). Both, or you get inconsistent isolation.
- **Webhook handler called outside drainer**: it expects to be in
  `withRLSBypass`; if you call it from a one-off script wrap it.
- **Tests touching the webhook breaker**: call
  `__resetWebhookBreakersForTests()` in `beforeEach` — it's a
  module-level Map.

## Where to look

| Want to… | Read |
| --- | --- |
| Understand layering | [docs/architecture.md](./docs/architecture.md) |
| Touch tenant resolution / auth | [docs/multi-tenancy.md](./docs/multi-tenancy.md) |
| Add an entity / migration | [docs/data-model.md](./docs/data-model.md) |
| Add an API endpoint | [docs/api.md](./docs/api.md) |
| Emit a domain event | [docs/events-and-outbox.md](./docs/events-and-outbox.md) |
| Configure tenant webhooks | [docs/webhooks.md](./docs/webhooks.md) |
| Cache something | [docs/cache.md](./docs/cache.md) |
| Debug prod | [docs/observability.md](./docs/observability.md), [docs/resilience.md](./docs/resilience.md) |
| Write tests | [docs/testing.md](./docs/testing.md) |
| Run locally | [docs/development.md](./docs/development.md) |

## Adding things — recipes

### A new use-case

1. `src/lib/application/use-cases/<area>/<name>.use-case.ts`
   implementing `IUseCase<Input, Output>`, decorated with
   `@injectable()`, dependencies via `@inject(TOKENS.X)`.
2. Validate input with Zod at the route boundary (helpers in
   `src/lib/validation/`); the use-case revalidates only its own
   domain rules.
3. Throw `DomainError` subclasses on failure
   (`EntityNotFoundError`, `ValidationError`, `ConflictError`,
   `BusinessRuleViolationError`). The wrapper translates to HTTP.
4. Test in `tests/unit/use-cases/<area>/<name>.test.ts` with
   `mock<IXRepository>()` from `vitest-mock-extended`.

### A new repository

1. Interface in `src/lib/domain/repositories/X.repository.ts`.
2. Prisma impl in `src/lib/infrastructure/repositories/prisma-X.repository.ts`.
3. Token in `src/lib/infrastructure/tokens.ts`.
4. Singleton binding in `src/lib/infrastructure/container.ts`.

### A new tenant-aware Prisma model

1. Add the model to `prisma/schema.prisma` with `tenantId` and
   composite indexes starting with `tenantId`.
2. Migration: enable + **force** RLS, create `tenant_isolation`
   policy with the standard USING/WITH CHECK on
   `app.tenant_id` / `app.bypass_rls`.
3. Add the camelCase model name to `tenantAwareModels` in
   `src/lib/prisma.ts`.
4. If the column is monetary, add a `>= 0` check constraint.

### A new domain event

1. Payload interface in `src/lib/domain/events/event-payloads.ts`.
2. Use-case publishes via the outbox publisher inside the
   transaction.
3. Handler in `src/lib/application/events/`, registered in
   `handlers.ts`. Make it idempotent — the drainer can replay.

### A new HTTP route

1. File `src/app/api/<area>/route.ts`.
2. Wrap in `withTenantApi` / `withSuperAdminApi` /
   `withErrorHandling`.
3. Resolve use-case from container; never go to Prisma directly.
4. Annotate OpenAPI in JSDoc.
5. Use `ApiResponse.*` for the response shape.

## Style

- TypeScript strict; prefer narrow types.
- No `any` unless interfacing untyped libs and well-commented.
- Default to **no comments**. Comment only on non-obvious *why* —
  hidden constraints, subtle invariants, gotchas. Identifiers should
  carry the *what*.
- Don't reference current task / PR / issue in code comments.
- Soft-delete via `deletedAt` on existing models; check that filter in
  queries.

## What NOT to do

- Don't create `*.md` files just because you finished a task. The
  user will ask if they want a doc.
- Don't refactor unrelated code while fixing a bug. Scope = task.
- Don't add error handling for cases that can't happen. Trust internal
  guarantees; validate at boundaries.
- Don't bypass hooks (`--no-verify`) or signing unless explicitly
  asked.
- Don't push, force-push, reset --hard, drop tables, or delete
  branches without explicit authorization.
- Don't run `BYPASS RLS` at the role level in Postgres "to debug
  faster" — use `withRLSBypass(fn)` in code with a comment.

## Tools / skills available

- `npm run dev` / `build` / `start` / `lint` / `typecheck` / `test` /
  `test:e2e` / `db:seed` / `analyze` (see `package.json`).
- Husky pre-commit runs `eslint --fix` on staged `*.ts`/`*.tsx`.
- For PRs touching auth, RLS, webhooks, payments: run
  `/security-review` (Claude Code skill).
- `/api/docs` serves a live OpenAPI reference (Scalar).

## When uncertain

Read first. The relevant doc in `docs/` or `node_modules/next/dist/docs/`
almost always answers it. If still unclear, ask the user — don't guess
in production-critical code (auth, RLS, money, migrations).
