import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import { IUseCase } from "../use-case.interface";
import { GetStorefrontFiltersResponse } from "../storefront/get-storefront-filters.use-case";

export interface GetBuylistFiltersRequest {
  tenantId: string;
}

interface CardMetadata {
  color_identity?: string[];
  type_line?: string;
}

@injectable()
export class GetBuylistFiltersUseCase implements IUseCase<GetBuylistFiltersRequest, GetStorefrontFiltersResponse> {
  constructor(@inject(TOKENS.BuylistRepository) private buylistRepo: IBuylistRepository) {}

  async execute(request: GetBuylistFiltersRequest): Promise<GetStorefrontFiltersResponse> {
    const { tenantId } = request;
    const items = await this.buylistRepo.findItemsByTenant(tenantId);

    const colorSet = new Set<string>();
    const typeSet = new Set<string>();
    const subtypeSet = new Set<string>();
    const setSet = new Set<string>();
    
    // Extras and languages are not directly in BuylistItem, they are user-selected.
    // However, we might want to show defaults.
    const languageSet = new Set<string>(["EN", "PT", "ES", "JP", "FR", "IT", "DE"]);

    items.forEach((item) => {
      const meta = item.cardTemplate?.metadata as unknown as CardMetadata;
      if (meta?.color_identity && Array.isArray(meta.color_identity)) {
        meta.color_identity.forEach((c: string) => colorSet.add(c));
      }
      if (meta?.type_line) {
        const parts = meta.type_line.split('\u2014');
        const mainType = parts[0].trim().split(' ')[0];
        if (mainType) typeSet.add(mainType);
        
        const subtypePart = parts[1]?.trim();
        if (subtypePart) {
          subtypePart.split(/\s+/).filter((st: string) => st && /^[A-Za-z'-]+$/.test(st)).forEach((st: string) => subtypeSet.add(st));
        }
      }
      if (item.cardTemplate?.set) {
        setSet.add(item.cardTemplate.set.toUpperCase());
      }
    });

    return {
      colors: [...Array.from(colorSet).sort(), "C"],
      types: Array.from(typeSet).sort(),
      subtypes: Array.from(subtypeSet).sort(),
      extras: [], // Not applicable for buylist templates usually
      sets: Array.from(setSet).sort(),
      languages: Array.from(languageSet).sort(),
    };
  }
}
