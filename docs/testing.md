# Testes

Duas camadas: **Vitest** para unit/integration e **Playwright** para
e2e.

## Unit / integration (Vitest)

Configuração em [`vitest.config.ts`](../vitest.config.ts). Diretório:
`tests/unit/`. Coverage: `@vitest/coverage-v8`.

```bash
npm test                # rodar tudo
npm run test:coverage   # com coverage
npx vitest <padrão>     # focar
npx vitest --watch      # watch mode
```

### O que testar aqui

- **Use-cases**: foco principal. Mock os repositórios via
  `vitest-mock-extended` (`mock<IXRepository>()`). Verifique
  comportamento, transições de estado e eventos publicados.
- **Serviços de domínio**: regras puras (sem I/O).
- **Helpers de proxy / segurança**: `extract-subdomain`, `csrf`,
  `rate-limit-policy`, `client-ip`.
- **Cache** com `MemoryCacheService` — não toca Redis em unit test.
- **Handlers de eventos** com bus em processo + repositórios mockados.

### Padrões

- **Não** instanciar `PrismaClient` em unit test. Se a coisa que você
  testa precisa de Prisma de verdade, a posição correta é um
  integration test (TODO: hoje não temos suite separada — o usuário
  decidiu por mocks por enquanto).
- Cada teste declara o cenário (Arrange), executa (Act), verifica
  (Assert) — sem `beforeAll` global escondendo setup importante.
- Datas: use `vi.useFakeTimers({ now: …})` em vez de `Date.now`
  embutido. Evita flake por boundary de minuto/dia.
- Para handlers de webhook que usam `fetch`: stub via
  `globalThis.fetch = vi.fn(...)` e zere breakers entre testes
  (`__resetWebhookBreakersForTests()`).
- Use `expect.toMatchObject({...})` em vez de `toEqual` quando o
  shape extra não importa.

### Estrutura do diretório

```
tests/unit/
├─ use-cases/        # 1 arquivo por use-case quando possível
├─ proxy/            # tenant resolver, rate-limit policy, etc.
├─ supabase/         # user-metadata
├─ resilience/       # circuit breaker, retry
└─ ...
```

## E2E (Playwright)

Configuração em [`playwright.config.ts`](../playwright.config.ts).
Diretório: `tests/e2e/`.

```bash
npm run test:e2e
npx playwright test --headed             # ver no navegador
npx playwright test path/to/file.spec.ts # focar
npx playwright show-report               # após uma run
```

### O que testar aqui

- Fluxos críticos do storefront (catálogo → produto → checkout).
- POS happy path.
- Login e bloqueio cross-tenant.
- Submissão pública de buylist.

E2E é **caro**. Não cubra regra de domínio que já tem unit test —
os e2e existem para validar a integração das peças.

### Subdomínios em e2e

Playwright precisa atingir `*.localhost`. Em CI usamos um host header
override no setup; em local os browsers modernos resolvem `*.localhost`
automaticamente.

## Coverage

Bandas atuais por camada (mira interna, não regra):

- `lib/domain` e `lib/application/use-cases`: alto (use-cases são
  pura lógica de negócio).
- `lib/infrastructure/repositories`: médio (lógica de mapeamento; o
  Prisma em si não testamos).
- `app/api/**/route.ts`: baixo (cobertura via e2e).

## Adicionar um teste

Para um use-case novo:

1. Crie `tests/unit/use-cases/<area>/<name>.use-case.test.ts`.
2. Use `mock<IXRepository>()` para cada dependência.
3. Resolva o use-case manualmente (sem container) passando os mocks.
4. Cubra: happy path, erro de não-encontrado, erro de validação,
   evento publicado.

Para um endpoint público novo:

1. Adicione um e2e em `tests/e2e/` cobrindo o golden path.
2. Não duplique a cobertura do use-case subjacente.

## CI

`npm run typecheck && npm run lint && npm test` é o gate. E2E roda em
um job separado (mais lento, paralelizado por shard).
