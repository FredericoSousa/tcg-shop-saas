import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";

interface UpdateInventoryRequest {
  id: string;
  tenantId: string;
  price?: number;
  quantity?: number;
}

@injectable()
export class UpdateInventoryUseCase {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: UpdateInventoryRequest): Promise<void> {
    const { id, tenantId, price, quantity } = request;
    await this.inventoryRepo.update(id, tenantId, { price, quantity });
  }
}
