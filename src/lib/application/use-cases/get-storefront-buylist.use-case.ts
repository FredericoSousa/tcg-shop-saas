import { inject, injectable } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IBuylistRepository } from "@/lib/domain/repositories/buylist.repository";
import type { BuylistItem } from "@/lib/domain/entities/buylist";
import { IUseCase } from "./use-case.interface";

export interface GetStorefrontBuylistRequest {
  tenantId: string;
  page: number;
  filters?: {
    search?: string;
    color?: string;
    type?: string;
    set?: string;
    [key: string]: any;
  };
}

export interface GetStorefrontBuylistResponse {
  items: BuylistItem[];
  total: number;
  pageCount: number;
}

@injectable()
export class GetStorefrontBuylistUseCase implements IUseCase<GetStorefrontBuylistRequest, GetStorefrontBuylistResponse> {
  constructor(
    @inject(TOKENS.BuylistRepository)
    private buylistRepository: IBuylistRepository
  ) {}

  async execute(request: GetStorefrontBuylistRequest): Promise<GetStorefrontBuylistResponse> {
    const pageSize = 30;
    const items = await this.buylistRepository.findStorefrontItems(
      request.tenantId,
      request.page,
      pageSize,
      request.filters
    );
    const total = await this.buylistRepository.countItems(request.tenantId, request.filters);

    return {
      items,
      total,
      pageCount: Math.ceil(total / pageSize),
    };
  }
}
