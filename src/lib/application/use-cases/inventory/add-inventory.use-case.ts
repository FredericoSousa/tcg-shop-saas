import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { 
  IInventoryRepository, 
  ICardTemplateRepository 
} from "@/lib/domain/repositories/inventory.repository";
import { scryfall } from "@/lib/scryfall";
import type { ScryfallCard } from "@/lib/types/scryfall";
import { getTenantId } from "@/lib/tenant-context";
import { IUseCase } from "../use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";
import { EntityNotFoundError } from "@/lib/domain/errors/domain.error";
import type { Condition } from "@/lib/domain/entities/inventory";

export interface AddInventoryRequest {
  scryfallId: string;
  price: number;
  quantity: number;
  condition: string;
  language: string;
  extras?: string[];
  allowNegativeStock?: boolean;
}

export interface AddInventoryResponse {
  success: boolean;
}

@injectable()
export class AddInventoryUseCase implements IUseCase<AddInventoryRequest, AddInventoryResponse> {
  constructor(
    @inject(TOKENS.InventoryRepository) private inventoryRepo: IInventoryRepository,
    @inject(TOKENS.CardTemplateRepository) private templateRepo: ICardTemplateRepository
  ) {}

  async execute(request: AddInventoryRequest): Promise<AddInventoryResponse> {
    const { 
      scryfallId, 
      price, 
      quantity, 
      condition, 
      language, 
      extras = [],
      allowNegativeStock = false
    } = request;

    // 1. Get or create Card Template
    let template = await this.templateRepo.findById(scryfallId);

    if (!template) {
      const scryfallData = await scryfall.getCardById(scryfallId);
      if (!scryfallData) {
        throw new EntityNotFoundError("CardTemplate", scryfallId);
      }

      const scryfallObj = scryfallData as ScryfallCard;
      const imageUris = scryfallObj.image_uris;

      template = await this.templateRepo.save({
        id: scryfallId,
        name: scryfallData.name,
        set: scryfallData.set.toUpperCase(),
        imageUrl:
          imageUris?.normal ||
          imageUris?.large ||
          imageUris?.png ||
          scryfallObj.card_faces?.[0]?.image_uris?.normal ||
          null,
        backImageUrl:
          scryfallObj.card_faces?.[1]?.image_uris?.normal || null,
        game: "MAGIC",
        metadata: scryfallData as unknown as Record<string, unknown>,
      });
    }

    const typedCondition = condition as Condition;
    const existing = await this.inventoryRepo.findByTemplate(template.id, {
      price,
      condition: typedCondition,
      language,
      extras,
    });

    if (existing) {
      await this.inventoryRepo.update(existing.id, {
        quantity: existing.quantity + quantity,
        active: true,
      });
    } else {
      await this.inventoryRepo.save({
        id: "",
        tenantId: getTenantId()!,
        cardTemplateId: template.id,
        price,
        quantity,
        condition: typedCondition,
        language,
        active: true,
        allowNegativeStock,
        extras,
      });
    }

    // Publish event
    domainEvents.publish(DOMAIN_EVENTS.INVENTORY_UPDATED, {
      tenantId: getTenantId()!,
      cardIds: [scryfallId],
      source: "add_use_case"
    }).catch(err => console.error("Error publishing INVENTORY_UPDATED:", err));

    return { success: true };
  }
}
