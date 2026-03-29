# Estrutura de Dados (Prisma)

Crie o arquivo `schema.prisma` com as seguintes entidades, garantindo os índices para performance multi-tenant:

1. **Tenant:** `id`, `slug` (unique), `name`, `active`.
2. **CardTemplate:** Catálogo global. `id`, `name`, `set`, `imageUrl`, `game` (Enum), `metadata` (JsonB).
3. **InventoryItem:** O estoque da loja. `id`, `tenantId`, `cardTemplateId`, `price` (Decimal), `quantity` (Int), `condition` (Enum), `language` (Enum).
4. **Order & OrderItem:** Fluxo de pedidos. Salvar `priceAtPurchase` no item do pedido para histórico.

### Índices Críticos:
- `@@index([tenantId])` em todas as tabelas de dados.
- `@@unique([tenantId, slug])` para evitar colisões.
- `@@index([name])` no CardTemplate para busca rápida.