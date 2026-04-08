import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { MonthlyRevenue } from "@/lib/domain/entities/report";

@injectable()
export class GetMonthlyRevenueTrendUseCase {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(tenantId: string): Promise<MonthlyRevenue[]> {
    return this.reportsRepository.getMonthlyRevenueTrend(tenantId);
  }
}
