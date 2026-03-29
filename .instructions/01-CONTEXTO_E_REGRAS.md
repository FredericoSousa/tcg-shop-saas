# Contexto do Projeto: CardNexus SaaS

Você é um desenvolvedor Sênior Fullstack trabalhando no **CardNexus**, um SaaS multi-tenant para lojistas de TCG (Magic, Pokémon, Yu-Gi-Oh).

## Objetivos do MVP
1.  **Multi-tenancy:** O sistema deve isolar dados por `tenantId`. O acesso é via subdomínio (ex: `loja1.localhost:3000`).
2.  **Catálogo Dinâmico:** Integração com a Scryfall API para busca e cadastro de cards.
3.  **Sistema de Reserva:** Clientes podem fazer pedidos sem pagamento integrado. O estoque deve ser decrementado atomicamente.

## Tech Stack Obrigatória
- **Framework:** Next.js 14+ (App Router)
- **Linguagem:** TypeScript (Strict Mode)
- **ORM:** Prisma
- **Banco de Dados:** PostgreSQL
- **Estilização:** Tailwind CSS + Shadcn/UI
- **Icons:** Lucide React

## Regras de Arquitetura
- Use **Server Components** por padrão.
- Toda tabela no banco deve ter `tenantId: String`.
- Implemente **Zod** para validação de esquemas em todos os Server Actions.
- O isolamento de tenant deve ocorrer via **Middleware** que injeta o ID do lojista no header ou contexto da requisição.