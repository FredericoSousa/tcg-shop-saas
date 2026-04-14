import { describe, it, expect, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { GetDashboardSummaryUseCase } from '@/lib/application/use-cases/get-dashboard-summary.use-case';
import type { IReportsRepository } from '@/lib/domain/repositories/report.repository';
import type { IInventoryRepository } from '@/lib/domain/repositories/inventory.repository';

describe('GetDashboardSummaryUseCase', () => {
  let useCase: GetDashboardSummaryUseCase;
  let reportsRepo: MockProxy<IReportsRepository>;
  let inventoryRepo: MockProxy<IInventoryRepository>;

  const tenantId = 'test-tenant-id';

  beforeEach(() => {
    reportsRepo = mock<IReportsRepository>();
    inventoryRepo = mock<IInventoryRepository>();
    useCase = new GetDashboardSummaryUseCase(reportsRepo, inventoryRepo);
  });

  it('should aggregate data from multiple repositories correctly', async () => {
    // Arrange
    inventoryRepo.countActive.mockResolvedValue(100);
    reportsRepo.getInventoryValuationBySet.mockResolvedValue([
      { set: 'Set A', value: 500, count: 50 },
      { set: 'Set B', value: 300, count: 30 },
    ]);
    reportsRepo.getRevenueByCategory.mockResolvedValue([
      { category: 'Category A', revenue: 1000, count: 10 },
      { category: 'Category B', revenue: 500, count: 5 },
    ]);
    reportsRepo.getWeeklyRevenue.mockResolvedValue([
      { day: 'Mon', amount: 100 },
      { day: 'Tue', amount: 200 },
    ]);

    // Act
    const result = await useCase.execute(tenantId);

    // Assert
    expect(result.inventoryCount).toBe(100);
    expect(result.totalInventoryValue).toBe(800);
    expect(result.ordersCount).toBe(15);
    expect(result.totalRevenue).toBe(1500);
    expect(result.weeklyRevenue).toHaveLength(2);
    expect(result.weeklyRevenue[0].amount).toBe(100);
    
    expect(inventoryRepo.countActive).toHaveBeenCalledWith(tenantId);
    expect(reportsRepo.getInventoryValuationBySet).toHaveBeenCalledWith(tenantId);
  });

  it('should handle empty data', async () => {
    // Arrange
    inventoryRepo.countActive.mockResolvedValue(0);
    reportsRepo.getInventoryValuationBySet.mockResolvedValue([]);
    reportsRepo.getRevenueByCategory.mockResolvedValue([]);
    reportsRepo.getWeeklyRevenue.mockResolvedValue([]);

    // Act
    const result = await useCase.execute(tenantId);

    // Assert
    expect(result.inventoryCount).toBe(0);
    expect(result.totalInventoryValue).toBe(0);
    expect(result.totalRevenue).toBe(0);
    expect(result.ordersCount).toBe(0);
  });
});
