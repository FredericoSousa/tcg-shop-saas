import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { RevenueReport } from "@/lib/domain/entities/report";
import { IUseCase } from "./use-case.interface";

export interface GetRevenueReportRequest {
  tenantId: string;
  startDate?: string;
  endDate?: string;
}

@injectable()
export class GetRevenueReportUseCase implements IUseCase<GetRevenueReportRequest, RevenueReport> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: GetRevenueReportRequest): Promise<RevenueReport> {
    const { tenantId, startDate, endDate } = request;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const [byCategory, bySet] = await Promise.all([
      this.reportsRepository.getRevenueByCategory(tenantId, start, end),
      this.reportsRepository.getRevenueBySet(tenantId, start, end)
    ]);

    return {
      byCategory,
      bySet,
      totalRevenue: byCategory.reduce((acc, curr) => acc + curr.revenue, 0),
      totalItemsSold: byCategory.reduce((acc, curr) => acc + curr.count, 0)
    };
  }
}
