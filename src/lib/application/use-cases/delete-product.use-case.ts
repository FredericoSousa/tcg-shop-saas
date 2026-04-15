import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IProductRepository } from "@/lib/domain/repositories/product.repository";
import { IUseCase } from "./use-case.interface";
import { domainEvents, DOMAIN_EVENTS } from "@/lib/domain/events/domain-events";

export interface DeleteProductRequest {
  id: string;
}

@injectable()
export class DeleteProductUseCase implements IUseCase<DeleteProductRequest, void> {
  constructor(@inject(TOKENS.ProductRepository) private productRepo: IProductRepository) {}

  async execute(request: DeleteProductRequest): Promise<void> {
    await this.productRepo.delete(request.id);

    // Publish event
    domainEvents.publish(DOMAIN_EVENTS.PRODUCT_DELETED, {
      productId: request.id
    }).catch(err => console.error("Error publishing PRODUCT_DELETED event:", err));
  }
}
