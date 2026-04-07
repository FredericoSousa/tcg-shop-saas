import { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";

interface DeleteInventoryRequest {
  ids: string[];
  tenantId: string;
}

export class DeleteInventoryUseCase {
  constructor(private inventoryRepo: IInventoryRepository) {}

  async execute(request: DeleteInventoryRequest): Promise<void> {
    await this.inventoryRepo.deleteMany(request.ids, request.tenantId);
  }
}
