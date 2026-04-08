import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import { IUseCase } from "./use-case.interface";

export interface DashboardSummary {
  inventoryCount: number;
  totalInventoryValue: number;
  ordersCount: number;
  totalRevenue: number;
  weeklyRevenue: { day: string; amount: number }[];
}

@injectable()
export class GetDashboardSummaryUseCase implements IUseCase<string, DashboardSummary> {
  constructor(
    @inject(TOKENS.ReportsRepository) private reportsRepository: IReportsRepository,
    @inject(TOKENS.InventoryRepository) private inventoryRepository: IInventoryRepository,
  ) {}

  async execute(tenantId: string): Promise<DashboardSummary> {
    const [inventoryCount, inventoryValuation, ordersProgress, weeklyRevenue] = await Promise.all([
      this.inventoryRepository.countActive(tenantId),
      this.reportsRepository.getInventoryValuationBySet(tenantId),
      this.reportsRepository.getRevenueByCategory(tenantId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days for revenue
      this.reportsRepository.getWeeklyRevenue(tenantId)
    ]);

    const totalInventoryValue = inventoryValuation.reduce((sum, item) => sum + item.value, 0);
    const totalRevenue = ordersProgress.reduce((sum, item) => sum + item.revenue, 0);
    
    return {
      inventoryCount,
      totalInventoryValue,
      ordersCount: ordersProgress.reduce((sum, item) => sum + item.count, 0),
      totalRevenue,
      weeklyRevenue
    };
  }
}
