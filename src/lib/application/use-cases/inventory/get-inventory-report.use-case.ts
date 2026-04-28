import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { InventoryConditionDistribution } from "@/lib/domain/entities/report";
import { IUseCase } from "../use-case.interface";

@injectable()
export class GetInventoryReportUseCase implements IUseCase<string, InventoryConditionDistribution[]> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(tenantId: string): Promise<InventoryConditionDistribution[]> {
    return this.reportsRepository.getInventoryConditionDistribution(tenantId);
  }
}
