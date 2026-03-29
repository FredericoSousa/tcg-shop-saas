# Instruções de Implementação

## 1. Middleware de Roteamento Multi-tenant
- O middleware deve interceptar a URL.
- Se a URL for `loja.dominio.com`, extrair o slug `loja`.
- Buscar o `tenantId` no banco e passar adiante via `x-tenant-id` nos headers.

## 2. Server Action: Cadastro de Card
- Criar uma action `addCardToInventory`.
- Deve receber o `scryfallId`.
- Verificar se o `CardTemplate` já existe; se não, buscar na API Scryfall e criar.
- Criar o `InventoryItem` vinculado ao `tenantId` da sessão.

## 3. Checkout (Transação Atômica)
- Ao finalizar o pedido, use `prisma.$transaction`.
- Verifique se `quantity >= requested_qty`.
- Use `decrement` atômico do Prisma para evitar race conditions:
  ```typescript
  tx.inventoryItem.updateMany({
    where: { id, quantity: { gte: qty } },
    data: { quantity: { decrement: qty } }
  })