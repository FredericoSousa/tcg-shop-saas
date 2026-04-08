import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { CustomerInsight } from "@/lib/domain/entities/report";
import { IUseCase } from "./use-case.interface";

export interface GetCustomerInsightsRequest {
  tenantId: string;
  customerId: string;
}

@injectable()
export class GetCustomerInsightsUseCase implements IUseCase<GetCustomerInsightsRequest, CustomerInsight> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: GetCustomerInsightsRequest): Promise<CustomerInsight> {
    const { tenantId, customerId } = request;
    const ltv = await this.reportsRepository.getCustomerLTV(tenantId, customerId);

    let tier = "Standard";
    if (ltv > 5000) tier = "Whale";
    else if (ltv > 1000) tier = "VIP";
    else if (ltv > 500) tier = "Frequente";

    return {
      ltv,
      tier,
      segments: [tier]
    };
  }
}
