import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../infrastructure/container";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import { InventoryValuation } from "@/lib/domain/entities/report";
import { IUseCase } from "../use-case.interface";

@injectable()
export class GetInventoryValuationUseCase implements IUseCase<string, InventoryValuation[]> {
  constructor(
    @inject(TOKENS.ReportsRepository)
    private reportsRepository: IReportsRepository
  ) {}

  async execute(tenantId: string): Promise<InventoryValuation[]> {
    return this.reportsRepository.getInventoryValuationBySet(tenantId);
  }
}
