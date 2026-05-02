# Modelo de dados

Schema completo em [`prisma/schema.prisma`](../prisma/schema.prisma).
Esta página é o mapa mental — relacionamentos, decisões de modelagem
e armadilhas.

## Convenções

- IDs em `UUID` (`gen_random_uuid()` no Postgres). `@db.Uuid`.
- Timestamps em `created_at` / `updated_at` (snake_case no banco,
  camelCase no Prisma via `@map`).
- **Dinheiro** em `Decimal(12, 2)` — nunca `Float`. Migration
  `20260428180000_money_precision_check_and_indexes` adiciona check
  constraints de não-negativo nos campos monetários.
- **Soft-delete** via `deletedAt: DateTime?` em `Product`,
  `ProductCategory`, `Customer`. Use-cases que buscam ativos filtram
  `deletedAt = null`. RLS não cobre soft-delete; isso é
  responsabilidade da query.
- **Índices** sempre por `tenantId` em primeiro lugar nas tabelas
  multi-tenant; combinações com status/data nos agregados quentes
  (ver migration `20260429100000_more_indexes`).

## Diagrama em texto

```
Tenant ──┬── InventoryItem ─── CardTemplate
         ├── Product ─── ProductCategory
         ├── Customer ─── CustomerCreditLedger
         │           └─── Order ─── OrderItem ─── (InventoryItem | Product)
         │                     └─── OrderPayment
         ├── BuylistItem ─── CardTemplate
         └── BuylistProposal ─── BuylistProposalItem ─── CardTemplate

CardTemplate é GLOBAL (sem tenantId) — catálogo compartilhado.
OutboxEvent e AuditLog são append-only (RLS aplicado a AuditLog).
```

## Entidades

### Tenant

Loja. Carrega branding (`brandColor`, `logoUrl`, `faviconUrl`),
contatos e os campos de webhook:

- `webhookUrl` (nullable) — alvo dos webhooks de saída. Null
  desativa entrega.
- `webhookSecret` (nullable) — segredo HMAC-SHA256. Rotacionado
  via Settings.

`slug` é único globalmente — usado para extrair o tenant a partir
do subdomínio.

### CardTemplate

**Catálogo global** de cartas. Não tem `tenantId` e portanto **não
tem RLS**. `name + set + game` identifica logicamente uma carta.
Metadata em JSON (cores, tipos, número, etc., conforme o jogo).
Compartilhar entre tenants reduz drasticamente a explosão de rows.

### InventoryItem

Uma "linha" de estoque do tenant: `cardTemplate + condition + language
+ price + quantity`. Cartas singles vivem aqui. Campos extras:

- `condition`: `NM | SP | MP | HP | D`
- `language`: string livre (`pt`, `en`, `jp`, …)
- `extras`: `String[]` (ex: `["foil", "promo"]`)
- `allowNegativeStock`: bypass para vendas adiantadas

Índices: `(tenantId)`, `(tenantId, quantity)`, `(cardTemplateId)`.

### Product / ProductCategory

Itens "lacrados" — boosters, decks, sleeves, deck-boxes. Diferente
de `InventoryItem` porque não tem condição/idioma. `category` define
agrupamento na vitrine. `showOnEcommerce` na categoria controla se
aparece para o público.

### Order / OrderItem / OrderPayment

- `source`: `POS | ECOMMERCE`
- `status`: `PENDING | PAID | SHIPPED | CANCELLED`
- `friendlyId`: identificador legível por loja (`@@unique([tenantId,
  friendlyId])`)
- `OrderItem` aponta para **`InventoryItem` ou `Product`** (mutuamente
  exclusivo na prática). `priceAtPurchase` é o preço *no momento da
  venda*, não o atual.
- `OrderPayment` permite **múltiplos pagamentos** por pedido (cash +
  pix + crédito de loja, por exemplo). Métodos:
  `CASH | CREDIT_CARD | DEBIT_CARD | PIX | TRANSFER | STORE_CREDIT | OTHER`.

Índices compostos por `(tenantId, status, createdAt)` e
`(tenantId, source)` para listagens do admin e relatórios.

### Customer + CustomerCreditLedger

`Customer.creditBalance` é cache. A **fonte de verdade** é o
`CustomerCreditLedger` — append-only com `type: CREDIT|DEBIT` e
`source: MANUAL|ORDER_PAYMENT|ORDER_REFUND|BUYLIST_PROPOSAL`.

Toda movimentação de crédito deve:

1. Inserir uma linha na ledger.
2. Atualizar `Customer.creditBalance` (na mesma transação).
3. Emitir `customer.credit.adjusted` via outbox.

`@@unique([phoneNumber, tenantId])` evita cliente duplicado por
telefone na mesma loja.

### BuylistItem / BuylistProposal / BuylistProposalItem

Buylist = lista de cartas que a loja **compra** do cliente.

- `BuylistItem` (cardTemplate + tenant) define `priceCash` e
  `priceCredit` que a loja paga.
- `BuylistProposal` é a proposta enviada pelo cliente:
  `PENDING → RECEIVED → APPROVED → PAID` (ou `CANCELLED`).
- `BuylistProposalItem` congela preço (`priceCash`/`priceCredit`),
  condição e idioma no momento da submissão — preços do `BuylistItem`
  podem mudar depois.

Pagar em crédito gera lançamento na ledger via handler do outbox.

### OutboxEvent

Append-only, drenado por cron. Detalhes em
[events-and-outbox.md](./events-and-outbox.md).

Campos chave: `eventName`, `payload` (JSONB), `processedAt`,
`attempts`, `lastError`, `deadLetteredAt`.

Índices: `(processedAt, createdAt)` para o picker do worker;
`(deadLetteredAt) WHERE deadLetteredAt IS NOT NULL` (parcial) para
a query de DLQ.

### AuditLog

Append-only para operações sensíveis. Nunca **UPDATE** ou **DELETE**
nessa tabela — retenção é trabalho de cron de infra.

`action`: `CREATE | UPDATE | DELETE | RESTORE`.
`metadata` (JSONB) carrega o diff/contexto. `actorId` opcional para
quando a ação vem de um job sem usuário.

## Tabelas em RLS

Tabelas com `tenant_id` que estão sob `tenant_isolation`:

```
inventory_items
product_categories
products
orders
customers
customer_credit_ledger
buylist_items
buylist_proposals
audit_logs
```

`tenants` e `card_templates` ficam fora (não têm `tenant_id`).
`order_items`, `order_payments`, `buylist_proposal_items` herdam
isolamento via FK do parent.

## Migrations

Em ordem cronológica (ver `prisma/migrations/`):

1. `20260410202551_init_db` — schema inicial.
2. `20260413171823_add_timestamp_columns_to_inventory_items`.
3. `20260413181828_add_timestamps_and_indexes`.
4. `20260414152335_add_indexes`.
5. `20260415145617_add_buylist_system`.
6. `20260422100000_drop_users_table` — após migrar para Supabase Auth.
7. `20260428180000_money_precision_check_and_indexes` — checks de
   valor monetário não-negativo + mais índices.
8. `20260428190000_audit_logs`.
9. `20260429100000_more_indexes`.
10. `20260430100000_enable_rls` — RLS + GUC contract.
11. `20260430110000_outbox_dead_letter` — coluna DLQ + índice parcial.
12. `20260430120000_tenant_webhooks` — `webhook_url` / `webhook_secret`
    no tenant.

Boas práticas ao criar nova migration:

- Cabeçalho explicando **por que** a mudança existe (não o que ela faz
  — o SQL já mostra).
- Para qualquer tabela nova com `tenant_id`, lembrar de habilitar RLS
  + criar policy `tenant_isolation` (e `FORCE`).
- Para colunas monetárias novas, adicionar check de não-negativo.
