import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { CustomerLTV } from "@/lib/domain/entities/report";

interface GetCustomerRankingRequest {
  tenantId: string;
  limit?: number;
}

@injectable()
export class GetCustomerRankingUseCase {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: GetCustomerRankingRequest): Promise<CustomerLTV[]> {
    const { tenantId, limit = 5 } = request;
    return this.reportsRepository.getTopCustomersByLTV(tenantId, limit);
  }
}
