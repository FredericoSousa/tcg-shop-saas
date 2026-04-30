import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type {
  IInventoryRepository,
  StorefrontFilters,
  StorefrontSortOption,
} from "@/lib/domain/repositories/inventory.repository";
import { InventoryItem } from "@/lib/domain/entities/inventory";
import { IUseCase } from "../use-case.interface";

const PAGE_SIZE = 20;
const VALID_SORTS: StorefrontSortOption[] = [
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
];

export interface GetStorefrontInventoryRequest {
  tenantId: string;
  page: number;
  filters?: {
    color?: string | string[];
    type?: string | string[];
    subtype?: string | string[];
    set?: string;
    extras?: string | string[];
    language?: string | string[];
    search?: string;
    sort?: string;
  };
}

export interface GetStorefrontInventoryResponse {
  items: InventoryItem[];
  total: number;
  pageCount: number;
}

@injectable()
export class GetStorefrontInventoryUseCase
  implements IUseCase<GetStorefrontInventoryRequest, GetStorefrontInventoryResponse>
{
  constructor(
    @inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository,
  ) {}

  async execute(request: GetStorefrontInventoryRequest): Promise<GetStorefrontInventoryResponse> {
    const { tenantId, page, filters } = request;
    const safePage = Math.max(1, page);

    const sort = filters?.sort && VALID_SORTS.includes(filters.sort as StorefrontSortOption)
      ? (filters.sort as StorefrontSortOption)
      : undefined;

    const repoFilters: StorefrontFilters = {
      search: filters?.search,
      set: filters?.set,
      language: filters?.language,
      color: filters?.color,
      type: filters?.type,
      subtype: filters?.subtype,
      extras: filters?.extras,
      sort,
    };

    const { items, total } = await this.inventoryRepo.findStorefrontItems(
      tenantId,
      safePage,
      PAGE_SIZE,
      repoFilters,
    );

    return {
      items,
      total,
      pageCount: Math.ceil(total / PAGE_SIZE) || 1,
    };
  }
}
