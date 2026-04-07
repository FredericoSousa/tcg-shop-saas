import { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";

interface UpdateInventoryRequest {
  id: string;
  tenantId: string;
  price?: number;
  quantity?: number;
}

export class UpdateInventoryUseCase {
  constructor(private inventoryRepo: IInventoryRepository) {}

  async execute(request: UpdateInventoryRequest): Promise<void> {
    const { id, tenantId, price, quantity } = request;
    await this.inventoryRepo.update(id, tenantId, { price, quantity });
  }
}
