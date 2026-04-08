import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { TopSellingProduct } from "@/lib/domain/entities/report";
import { IUseCase } from "./use-case.interface";

export interface GetTopSellingProductsRequest {
  tenantId: string;
  limit?: number;
}

@injectable()
export class GetTopSellingProductsUseCase implements IUseCase<GetTopSellingProductsRequest, TopSellingProduct[]> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: GetTopSellingProductsRequest): Promise<TopSellingProduct[]> {
    const { tenantId, limit = 10 } = request;
    return this.reportsRepository.getTopSellingProducts(tenantId, limit);
  }
}
