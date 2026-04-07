import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";

interface DeleteInventoryRequest {
  ids: string[];
  tenantId: string;
}

@injectable()
export class DeleteInventoryUseCase {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: DeleteInventoryRequest): Promise<void> {
    await this.inventoryRepo.deleteMany(request.ids, request.tenantId);
  }
}
