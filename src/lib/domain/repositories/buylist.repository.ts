import { BuylistItem, BuylistProposal, BuylistStatus } from "../entities/buylist";

export interface IBuylistRepository {
  // Buylist Items (Configuração do que a loja quer comprar)
  findItemsByTenant(tenantId: string): Promise<BuylistItem[]>;
  findItemByTemplate(tenantId: string, cardTemplateId: string): Promise<BuylistItem | null>;
  saveItem(item: BuylistItem): Promise<BuylistItem>;
  deleteItem(id: string): Promise<void>;

  // Propostas de clientes
  saveProposal(proposal: BuylistProposal): Promise<BuylistProposal>;
  findProposalById(id: string): Promise<BuylistProposal | null>;
  findProposalsByTenant(tenantId: string): Promise<BuylistProposal[]>;
  updateProposalStatus(id: string, status: BuylistStatus, staffNotes?: string): Promise<void>;
}

// Dummy export to ensure Turbopack recognizes this as a module with exports
export const __buylist_repo = true;
