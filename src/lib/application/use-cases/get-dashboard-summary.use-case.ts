import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../infrastructure/container";
import type { IReportsRepository } from "@/lib/domain/repositories/report.repository";
import type { IInventoryRepository } from "@/lib/domain/repositories/inventory.repository";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";

interface DashboardSummary {
  inventoryCount: number;
  totalInventoryValue: number;
  ordersCount: number;
  totalRevenue: number;
  weeklyRevenue: { day: string; amount: number }[];
}

@injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @inject(TOKENS.ReportsRepository) private reportsRepository: IReportsRepository,
    @inject(TOKENS.InventoryRepository) private inventoryRepository: IInventoryRepository,
    @inject(TOKENS.OrderRepository) private orderRepository: IOrderRepository
  ) {}

  async execute(tenantId: string): Promise<DashboardSummary> {
    const [inventoryCount, inventoryValuation, ordersProgress] = await Promise.all([
      this.inventoryRepository.countActive(tenantId),
      this.reportsRepository.getInventoryValuationBySet(tenantId),
      this.reportsRepository.getRevenueByCategory(tenantId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days for revenue
      this.reportsRepository.getMonthlyRevenueTrend(tenantId)
    ]);

    // For simplicity in this example, we calculate some values here
    // In a real app, we might have more specialized repository methods
    const totalInventoryValue = inventoryValuation.reduce((sum, item) => sum + item.value, 0);
    const totalRevenue = ordersProgress.reduce((sum, item) => sum + item.revenue, 0);
    
    // Format weekly revenue (mocking since we don't have a direct repo call for weekly yet)
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const mockWeekly = days.map(day => ({ 
      day, 
      amount: Math.floor(Math.random() * 500) + 100 
    }));

    return {
      inventoryCount,
      totalInventoryValue,
      ordersCount: ordersProgress.reduce((sum, item) => sum + item.count, 0),
      totalRevenue,
      weeklyRevenue: mockWeekly
    };
  }
}
