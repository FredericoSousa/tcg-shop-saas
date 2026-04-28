import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { MonthlyRevenue } from "@/lib/domain/entities/report";
import { IUseCase } from "../use-case.interface";

@injectable()
export class GetMonthlyRevenueTrendUseCase implements IUseCase<string, MonthlyRevenue[]> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(tenantId: string): Promise<MonthlyRevenue[]> {
    return this.reportsRepository.getMonthlyRevenueTrend(tenantId);
  }
}
