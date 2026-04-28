import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { InventoryItem } from "@/lib/domain/entities/inventory";
import { IUseCase } from "../use-case.interface";

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

interface CardMetadata {
  color_identity?: string[];
  type_line?: string;
}

@injectable()
export class GetStorefrontInventoryUseCase implements IUseCase<GetStorefrontInventoryRequest, GetStorefrontInventoryResponse> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: GetStorefrontInventoryRequest): Promise<GetStorefrontInventoryResponse> {
    const { tenantId, page, filters } = request;
    const limit = 20;
    
    // We'll get all active items and filter in JS for complex metadata
    // This maintains the behavior of the legacy service but in a use case.
    const allItems = await this.inventoryRepo.findAllActive(tenantId);
    
    // 1. Basic filtering
    const filtered = allItems.filter(item => {
      const meta = item.cardTemplate?.metadata as unknown as CardMetadata;
      if (filters?.color) {
        const expectedColors = Array.isArray(filters.color) ? filters.color : filters.color.split(',');
        const cardColors = meta?.color_identity || [];
        
        const isColorless = cardColors.length === 0;
        const matchesColorless = isColorless && expectedColors.includes("C");
        const matchesColor = !isColorless && expectedColors.some(c => cardColors.includes(c));
        
        if (!matchesColorless && !matchesColor) return false;
      }
      if (filters?.type) {
        const expectedTypes = Array.isArray(filters.type) ? filters.type : filters.type.split(',');
        if (!meta?.type_line) return false;
        const matchesType = expectedTypes.some(t => meta?.type_line?.includes(t));
        if (!matchesType) return false;
      }
      if (filters?.set && item.cardTemplate?.set.toUpperCase() !== filters.set.toUpperCase()) return false;
      if (filters?.subtype) {
        const expectedSubtypes = Array.isArray(filters.subtype) ? filters.subtype : filters.subtype.split(',');
        const typeLine = meta?.type_line || '';
        const subtypePart = typeLine.split('\u2014')[1]?.trim() || '';
        const cardSubtypes = subtypePart.split(/\s+/).filter(Boolean);
        const matchesSubtype = expectedSubtypes.some((st: string) => cardSubtypes.some((cs: string) => cs.toLowerCase() === st.toLowerCase()));
        if (!matchesSubtype) return false;
      }
      if (filters?.extras) {
        const expectedExtras = Array.isArray(filters.extras) ? filters.extras : filters.extras.split(',');
        const itemExtras = item.extras || [];
        const matchesExtras = expectedExtras.some(e => itemExtras.includes(e));
        if (!matchesExtras) return false;
      }
      if (filters?.language) {
        const expectedLangs = Array.isArray(filters.language) ? filters.language : filters.language.split(',');
        if (!expectedLangs.includes(item.language)) return false;
      }
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        if (!item.cardTemplate?.name.toLowerCase().includes(query)) return false;
      }
      return item.quantity > 0;
    });

    // 2. Sorting
    if (filters?.sort) {
      if (filters.sort === 'price_asc') {
        filtered.sort((a, b) => a.price - b.price);
      } else if (filters.sort === 'price_desc') {
        filtered.sort((a, b) => b.price - a.price);
      } else if (filters.sort === 'name_asc') {
        filtered.sort((a, b) => (a.cardTemplate?.name || '').localeCompare(b.cardTemplate?.name || ''));
      } else if (filters.sort === 'name_desc') {
        filtered.sort((a, b) => (b.cardTemplate?.name || '').localeCompare(a.cardTemplate?.name || ''));
      }
    } else {
      filtered.sort((a, b) => (a.cardTemplate?.name || '').localeCompare(b.cardTemplate?.name || ''));
    }

    // 3. Pagination
    const total = filtered.length;
    const skip = (Math.max(1, page) - 1) * limit;
    const items = filtered.slice(skip, skip + limit);

    return {
      items,
      total,
      pageCount: Math.ceil(total / limit) || 1
    };
  }
}
