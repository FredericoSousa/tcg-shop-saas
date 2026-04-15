import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { BuylistItem } from "@/lib/domain/entities/buylist";
import { IUseCase } from "./use-case.interface";

@injectable()
export class SaveBuylistItemUseCase implements IUseCase<BuylistItem, BuylistItem> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository
  ) {}

  async execute(item: BuylistItem): Promise<BuylistItem> {
    return this.buylistRepository.saveItem(item);
  }
}
