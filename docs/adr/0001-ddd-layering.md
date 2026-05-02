# ADR 0001 — Camadas DDD + tsyringe

- **Status:** aceito
- **Data:** 2026-04-10

## Contexto

Precisávamos separar regras de negócio da infraestrutura para:

1. Testar use-cases sem subir Prisma/Redis em cada teste.
2. Permitir trocar implementações sem reescrever lógica de negócio
   (ex: Prisma → outro ORM, Redis → outro cache).
3. Tornar dependências explícitas — quem depende do quê fica visível
   no construtor, não escondido em imports.

Alternativas consideradas:

- **Camada única**: rotas chamando Prisma direto. Funciona até a
  primeira regra de negócio compartilhada entre dois endpoints.
- **Service layer plana**: serviços globais sem DI. Funciona até dois
  testes precisarem de versões diferentes da mesma dep.

## Decisão

Três camadas com dependências apontando sempre para dentro:

```
app  ──►  application  ──►  domain
                     ▲
                infrastructure
```

- **`domain`** — entidades, repositórios (interfaces), serviços,
  eventos, erros. Zero dep de framework.
- **`application`** — use-cases (`IUseCase<I, O>`) e handlers de
  eventos. Coordena, não persiste.
- **`infrastructure`** — implementações concretas de repositórios,
  cache, HTTP helpers. É o único lugar com Prisma/Redis/Supabase.
- **`app/`** (Next) consome use-cases via container.

DI via **tsyringe** com tokens simbólicos em `TOKENS` — evita string
literals e garante checagem de typo em compile time.

## Consequências

**Positivas**

- Use-cases unit-testados com mocks (`vitest-mock-extended`) sem
  banco real.
- Trocar Prisma é uma migração local: novas implementações de
  `infrastructure/repositories/` sem tocar regras.
- Borda HTTP fina: rotas só validam, autenticam e delegam.

**Negativas**

- Cada novo recurso exige cinco arquivos: entidade + interface + impl
  + token + binding. Aceito como custo do isolamento.
- Para um time pequeno, essa estrutura é mais cerimônia do que um
  service plano daria. A escolha foi por **escala futura** e
  **testabilidade**, não por necessidade imediata.

## Alternativas rejeitadas

- **Service plano sem DI**: barato hoje, dolorido quando dois
  consumidores da mesma função precisam de versões diferentes (ex:
  cache real vs. fake). Sem DI a única saída é monkey-patching, que
  perde tipos.
- **Hexagonal puro**: ports e adapters explícitos. Não compensa o
  overhead extra para a maioria dos casos — ficamos com a versão
  simplificada onde "interface no domain + classe no infra" já é o
  port/adapter.
