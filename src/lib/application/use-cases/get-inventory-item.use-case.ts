import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { InventoryItem } from "@/lib/domain/entities/inventory";
import { IUseCase } from "./use-case.interface";

export interface GetInventoryItemRequest {
  id: string;
  tenantId: string;
}

@injectable()
export class GetInventoryItemUseCase implements IUseCase<GetInventoryItemRequest, InventoryItem | null> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: GetInventoryItemRequest): Promise<InventoryItem | null> {
    const { id, tenantId } = request;
    const item = await this.inventoryRepo.findById(id);

    if (!item || item.tenantId !== tenantId) {
      return null;
    }

    return item;
  }
}
