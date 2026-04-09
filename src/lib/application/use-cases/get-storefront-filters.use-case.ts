import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { IUseCase } from "./use-case.interface";

export interface GetStorefrontFiltersRequest {
  tenantId: string;
}

export interface GetStorefrontFiltersResponse {
  colors: string[];
  types: string[];
  subtypes: string[];
  extras: string[];
  sets: string[];
  languages: string[];
}

interface CardMetadata {
  color_identity?: string[];
  type_line?: string;
}

@injectable()
export class GetStorefrontFiltersUseCase implements IUseCase<GetStorefrontFiltersRequest, GetStorefrontFiltersResponse> {
  constructor(@inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository) {}

  async execute(request: GetStorefrontFiltersRequest): Promise<GetStorefrontFiltersResponse> {
    const { tenantId } = request;
    const items = await this.inventoryRepo.findAllActive(tenantId);

    const colorSet = new Set<string>();
    const typeSet = new Set<string>();
    const subtypeSet = new Set<string>();
    const extrasSet = new Set<string>();
    const setSet = new Set<string>();
    const languageSet = new Set<string>();

    items.filter(i => i.quantity > 0).forEach((item) => {
      const meta = item.cardTemplate?.metadata as unknown as CardMetadata;
      if (meta?.color_identity && Array.isArray(meta.color_identity)) {
        meta.color_identity.forEach((c: string) => colorSet.add(c));
      }
      if (meta?.type_line) {
        const mainType = meta.type_line.split('\u2014')[0].trim().split(' ')[0];
        if (mainType) typeSet.add(mainType);
        const subtypePart = meta.type_line.split('\u2014')[1]?.trim();
        if (subtypePart) {
          subtypePart.split(/\s+/).filter((st: string) => st && /^[A-Za-z'-]+$/.test(st)).forEach((st: string) => subtypeSet.add(st));
        }
      }
      if (item.cardTemplate?.set) {
        setSet.add(item.cardTemplate.set.toUpperCase());
      }
      if (item.extras && Array.isArray(item.extras)) {
        item.extras.forEach((e: string) => extrasSet.add(e));
      }
      if (item.language) {
        languageSet.add(item.language);
      }
    });

    return {
      colors: [...Array.from(colorSet).sort(), "C"],
      types: Array.from(typeSet).sort(),
      subtypes: Array.from(subtypeSet).sort(),
      extras: Array.from(extrasSet).sort(),
      sets: Array.from(setSet).sort(),
      languages: Array.from(languageSet).sort(),
    };
  }
}
