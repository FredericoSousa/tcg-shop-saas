import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { BuylistItem } from "@/lib/domain/entities/buylist";
import { IUseCase } from "../use-case.interface";

@injectable()
export class ListBuylistItemsUseCase implements IUseCase<string, BuylistItem[]> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository
  ) {}

  async execute(tenantId: string): Promise<BuylistItem[]> {
    return this.buylistRepository.findItemsByTenant(tenantId);
  }
}
