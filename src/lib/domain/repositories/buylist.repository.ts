import { BuylistItem, BuylistProposal, BuylistStatus } from "../entities/buylist";

export interface IBuylistRepository {
  // Buylist Items (Configuração do que a loja quer comprar)
  findItemsByTenant(tenantId: string): Promise<BuylistItem[]>;
  findStorefrontItems(tenantId: string, page: number, pageSize: number, filters?: Record<string, unknown>): Promise<BuylistItem[]>;
  countItems(tenantId: string, filters?: Record<string, unknown>): Promise<number>;
  findItemByTemplate(tenantId: string, cardTemplateId: string): Promise<BuylistItem | null>;
  saveItem(item: BuylistItem): Promise<BuylistItem>;
  deleteItem(id: string): Promise<void>;

  // Propostas de clientes
  saveProposal(proposal: BuylistProposal): Promise<BuylistProposal>;
  findProposalById(id: string): Promise<BuylistProposal | null>;
  findProposalsByTenant(tenantId: string): Promise<BuylistProposal[]>;
  findProposalsByCustomerId(customerId: string): Promise<BuylistProposal[]>;
  updateProposalStatus(id: string, status: BuylistStatus, staffNotes?: string, tx?: unknown): Promise<void>;
}

// Dummy export to ensure Turbopack recognizes this as a module with exports
export const __buylist_repo = true;
