# ADR 0004 — Postgres RLS como defesa em profundidade

- **Status:** aceito
- **Data:** 2026-04-30
- **Substitui:** parcialmente o ADR 0002 original que afirmava
  "isolamento é responsabilidade da aplicação".

## Contexto

A versão original do isolamento multi-tenant deixava 100% da
responsabilidade na aplicação. Funciona enquanto **toda** consulta
passa pela extensão Prisma. Mas:

- Consultas raw (`$queryRaw`) ignoram a extensão.
- Migrations com `UPDATE` ad-hoc não respeitam o filtro.
- Ferramentas administrativas (psql direto, painéis de DBA, scripts
  one-off) operam fora do app.
- Bug futuro pode passar `findFirst` num modelo não listado em
  `tenantAwareModels` e ninguém notar até dados vazarem.

A consequência de uma falha aqui é catastrófica: **vazamento
cross-tenant**. O risco justifica defesa em profundidade.

## Decisão

Habilitar **Row Level Security** no Postgres em toda tabela com
`tenant_id`. Migration `20260430100000_enable_rls`.

### Contrato das policies

```sql
USING (
  current_setting('app.bypass_rls', true) = 'on'
  OR tenant_id::text = current_setting('app.tenant_id', true)
)
WITH CHECK (...)
```

- `app.tenant_id` setado por query → row visível se tenant casa.
- `app.bypass_rls = 'on'` → bypass explícito (workers cross-tenant,
  lookup pré-contexto, login).
- Nenhum dos dois → **zero rows visíveis** (força chamador a
  declarar intenção).

### `FORCE ROW LEVEL SECURITY`

Crítico. Sem `FORCE`, o owner do schema (a role que o Prisma usa)
bypassa RLS por padrão e a defesa fica decorativa. Com `FORCE`, **todo
mundo** passa pela policy.

### Aplicação das GUCs

A extensão Prisma em [`src/lib/prisma.ts`](../../src/lib/prisma.ts)
envolve cada operação numa transação que executa antes da query:

```sql
SELECT set_config('app.tenant_id', $1, true)
-- ou:
SELECT set_config('app.bypass_rls', 'on', true)
```

`set_config(..., true)` é **transaction-local** — morre com a tx.
Compatível com PgBouncer em transaction mode (a próxima request pega
uma sessão "limpa").

Operações sem tenant **e** sem bypass não setam GUC: queries em
modelos sem `tenant_id` (como `tenants`, `card_templates`) seguem
normais; queries em modelos com `tenant_id` retornam 0 rows (e a
extensão app-level já filtrou antes).

### Bypass intencional

Único atalho: `withRLSBypass(fn)`. Lugares legítimos:

- Drainer do outbox (lê eventos de todos os tenants).
- Lookup de tenant pelo slug (acontece *antes* do contexto).
- Fluxo de login (precisa achar tenant a partir do email/slug).

Toda chamada deve ter comentário no código justificando.

## Consequências

**Positivas**

- Esquecer `tenantId` numa query **falha** (zero rows) em vez de
  vazar.
- Ferramentas administrativas/migrations precisam declarar bypass
  explícito — não há vazamento "por descuido".
- Auditoria mais simples: o filtro está no banco, não distribuído
  pela aplicação.

**Negativas**

- Toda query agora roda em transação (overhead de `BEGIN`/`COMMIT`
  + um `SELECT set_config` antes). Mensurado, fica em poucas ms para
  queries simples — aceito.
- `withRLSBypass` é uma porta dos fundos que precisa de disciplina.
  Mitigação: existe um único helper, fácil de buscar (`grep
  withRLSBypass`) e revisar em PR.
- Tabelas filhas (`order_items`, etc.) não têm policy direta —
  herdam isolamento via FK do parent. Em teoria alguém pode escrever
  `INSERT INTO order_items` apontando para um `order_id` de outro
  tenant; a foreign key existe mas não checa tenant. Mitigação atual:
  todo INSERT passa por use-case que valida ownership do `Order`.

## Alternativas rejeitadas

- **Manter só app-level**: vimos a fragilidade. Defesa única em
  contexto sensível não é defesa.
- **Database por tenant**: isolamento perfeito mas custo
  operacional altíssimo (migrations N vezes, conexões N vezes,
  backup N vezes). Não compensa para o tamanho atual.
- **Schema por tenant**: meio-termo, melhor que database mas ainda
  pesado em migrations e cross-tenant queries (relatórios consolidados,
  super-admin) viram joins entre schemas.

## Notas operacionais

- Em incidente, **nunca** rodar `BYPASS RLS` no nível da role no
  Postgres "para investigar mais rápido" — perde o controle de
  auditoria. Use `withRLSBypass` em código com motivo gravado.
- Para verificar se a policy está ativa:
  ```sql
  SELECT relname, relforcerowsecurity
    FROM pg_class
   WHERE relname = 'orders';
  ```
  Espera-se `relforcerowsecurity = true`.
