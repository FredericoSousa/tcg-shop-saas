import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { BuylistProposal } from "@/lib/domain/entities/buylist";
import { IUseCase } from "./use-case.interface";

@injectable()
export class ListBuylistProposalsUseCase implements IUseCase<string, BuylistProposal[]> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository
  ) {}

  async execute(tenantId: string): Promise<BuylistProposal[]> {
    return this.buylistRepository.findProposalsByTenant(tenantId);
  }
}
