import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { IUseCase } from "./use-case.interface";

export interface DeleteInventoryRequest {
  ids: string[];
}

@injectable()
export class DeleteInventoryUseCase implements IUseCase<DeleteInventoryRequest, void> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: DeleteInventoryRequest): Promise<void> {
    await this.inventoryRepo.deactivateMany(request.ids);
  }
}
