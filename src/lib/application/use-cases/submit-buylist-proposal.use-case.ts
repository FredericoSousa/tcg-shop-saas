import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { ICustomerRepository } from "@/lib/domain/repositories/customer.repository";
import { BuylistProposal } from "@/lib/domain/entities/buylist";
import { IUseCase } from "./use-case.interface";

interface SubmitBuylistProposalRequest {
  tenantId: string;
  customerData: {
    name?: string;
    email?: string;
    phoneNumber: string;
  };
  items: Array<{
    cardTemplateId: string;
    quantity: number;
    condition: string;
    language: string;
    priceCash: number;
    priceCredit: number;
  }>;
}

@injectable()
export class SubmitBuylistProposalUseCase implements IUseCase<SubmitBuylistProposalRequest, BuylistProposal> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository,
    @inject(TOKENS.CustomerRepository)
    private customerRepository: ICustomerRepository
  ) {}

  async execute(request: SubmitBuylistProposalRequest): Promise<BuylistProposal> {
    // 1. Upsert Customer
    const customer = await this.customerRepository.upsert(request.customerData.phoneNumber, {
      name: request.customerData.name,
      email: request.customerData.email,
    });

    // 2. Calculate Totals
    const totalCash = request.items.reduce((acc, item) => acc + ((item.priceCash || 0) * item.quantity), 0);
    const totalCredit = request.items.reduce((acc, item) => acc + ((item.priceCredit || 0) * item.quantity), 0);

    // 3. Create Proposal
    const proposal: BuylistProposal = {
      id: "", 
      tenantId: request.tenantId,
      customerId: customer.id,
      status: 'PENDING',
      totalCash,
      totalCredit,
      staffNotes: null,
      items: request.items.map(item => ({
        ...item,
        priceCash: item.priceCash || 0,
        priceCredit: item.priceCredit || 0
      })) as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.buylistRepository.saveProposal(proposal);
  }
}
