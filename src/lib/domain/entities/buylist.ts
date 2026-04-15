import { CardTemplate } from "./inventory";

export type BuylistStatus = 'PENDING' | 'RECEIVED' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface BuylistItem {
  id: string;
  tenantId: string;
  cardTemplateId: string;
  priceCash: number;
  priceCredit: number;
  active: boolean;
  cardTemplate?: CardTemplate;
}

export interface BuylistProposal {
  id: string;
  tenantId: string;
  customerId: string;
  status: BuylistStatus;
  totalCash: number;
  totalCredit: number;
  staffNotes: string | null;
  items?: BuylistProposalItem[];
  createdAt: Date;
  updatedAt: Date;
  customer?: {
    name: string;
    phoneNumber: string;
  };
}

export interface BuylistProposalItem {
  id: string;
  buylistProposalId: string;
  cardTemplateId: string;
  quantity: number;
  condition: string;
  language: string;
  priceCash: number;
  priceCredit: number;
  cardTemplate?: CardTemplate;
}

// Helpers
export function calculateProposalTotals(items: BuylistProposalItem[]) {
  return items.reduce((acc, item) => ({
    cash: acc.cash + (item.priceCash * item.quantity),
    credit: acc.credit + (item.priceCredit * item.quantity)
  }), { cash: 0, credit: 0 });
}
