import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";

interface BulkUpdateInventoryRequest {
  ids: string[];
  price?: number;
  quantity?: number;
}

@injectable()
export class BulkUpdateInventoryUseCase {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: BulkUpdateInventoryRequest): Promise<void> {
    const { ids, price, quantity } = request;
    await this.inventoryRepo.updateMany(ids, { price, quantity });
  }
}
