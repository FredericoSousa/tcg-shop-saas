import { injectable, inject } from "tsyringe";
import { TOKENS } from "@/lib/infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { CustomerLTV } from "@/lib/domain/entities/report";
import { IUseCase } from "../use-case.interface";

export interface GetCustomerRankingRequest {
  tenantId: string;
  limit?: number;
}

@injectable()
export class GetCustomerRankingUseCase implements IUseCase<GetCustomerRankingRequest, CustomerLTV[]> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: GetCustomerRankingRequest): Promise<CustomerLTV[]> {
    const { tenantId, limit = 5 } = request;
    return this.reportsRepository.getTopCustomersByLTV(tenantId, limit);
  }
}
