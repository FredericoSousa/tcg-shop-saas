# ADR 0001 — Camadas DDD + tsyringe

- **Status:** aceito
- **Data:** 2026-04-10

## Contexto

Precisávamos separar regras de negócio da infraestrutura para (a) testar
use-cases sem subir Prisma/Redis e (b) permitir trocar implementações
(ex: migrar de Prisma para outro ORM, substituir Redis por outro cache).

## Decisão

Adotar três camadas — `domain`, `application`, `infrastructure` — com
dependências apontando sempre para dentro. DI via `tsyringe` com tokens
simbólicos em `TOKENS`.

## Consequências

- Testes unitários de use-cases usam mocks das interfaces de repositório,
  sem banco real.
- Todo acesso a dados passa por um repositório; Server Components não
  devem instanciar `PrismaClient` diretamente.
- Overhead: cada novo recurso exige entidade + interface + impl + token +
  binding. Aceito.
