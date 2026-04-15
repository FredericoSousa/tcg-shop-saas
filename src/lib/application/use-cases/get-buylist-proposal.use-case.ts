import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import { BuylistProposal } from "@/lib/domain/entities/buylist";
import { EntityNotFoundError } from "@/lib/domain/errors/domain.error";
import { IUseCase } from "./use-case.interface";

@injectable()
export class GetBuylistProposalUseCase implements IUseCase<string, BuylistProposal> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository
  ) {}

  async execute(id: string): Promise<BuylistProposal> {
    const proposal = await this.buylistRepository.findProposalById(id);
    if (!proposal) {
      throw new EntityNotFoundError("Proposta de buylist não encontrada", "BUYLIST_PROPOSAL_NOT_FOUND");
    }
    return proposal;
  }
}
