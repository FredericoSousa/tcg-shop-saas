import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { SalesBySource } from "@/lib/domain/entities/report";
import { IUseCase } from "../use-case.interface";

export interface GetSalesSourceReportRequest {
  tenantId: string;
  startDate?: string;
  endDate?: string;
}

@injectable()
export class GetSalesSourceReportUseCase implements IUseCase<GetSalesSourceReportRequest, SalesBySource[]> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(request: GetSalesSourceReportRequest): Promise<SalesBySource[]> {
    const { tenantId, startDate, endDate } = request;
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    return this.reportsRepository.getSalesBySource(tenantId, start, end);
  }
}
