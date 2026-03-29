# Padrões de UI

## Dashboard do Lojista
- Use um layout de **Sidebar** persistente.
- A tela de inventário deve ser uma **DataTable** com busca debounced.
- O cadastro de card deve ser um **Sheet** (drawer lateral) para não perder o contexto da lista.

## Storefront (Visão do Cliente)
- Grid de cards com aspecto 2:3 (proporção padrão de TCG).
- Badge de cor/elemento baseada no metadata do card.
- Carrinho persistente no `localStorage` ou `Session`.

## Componentes Shadcn/UI a instalar:
- Button, Input, Table, Dialog, Sheet, Badge, Toast, Command (para busca rápida).