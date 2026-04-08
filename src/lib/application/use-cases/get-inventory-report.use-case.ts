import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { InventoryConditionDistribution } from "@/lib/domain/entities/report";

@injectable()
export class GetInventoryReportUseCase {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(tenantId: string): Promise<InventoryConditionDistribution[]> {
    return this.reportsRepository.getInventoryConditionDistribution(tenantId);
  }
}
