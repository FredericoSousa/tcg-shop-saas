import { describe, it, expect, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { GetMonthlyRevenueTrendUseCase } from '@/lib/application/use-cases/get-monthly-revenue-trend.use-case';
import { GetRevenueReportUseCase } from '@/lib/application/use-cases/get-revenue-report.use-case';
import { GetSalesSourceReportUseCase } from '@/lib/application/use-cases/get-sales-source-report.use-case';
import { GetTopSellingProductsUseCase } from '@/lib/application/use-cases/get-top-selling-products.use-case';
import { GetInventoryValuationUseCase } from '@/lib/application/use-cases/get-inventory-valuation.use-case';
import { GetInventoryReportUseCase } from '@/lib/application/use-cases/get-inventory-report.use-case';
import type { IReportsRepository } from '@/lib/domain/repositories/report.repository';

describe('Analytics & Reports Use Cases', () => {
  let reportsRepo: MockProxy<IReportsRepository>;
  const tenantId = 'test-tenant-id';

  beforeEach(() => {
    reportsRepo = mock<IReportsRepository>();
  });

  describe('GetMonthlyRevenueTrendUseCase', () => {
    it('should return revenue trend', async () => {
      const useCase = new GetMonthlyRevenueTrendUseCase(reportsRepo);
      await useCase.execute(tenantId);
      expect(reportsRepo.getMonthlyRevenueTrend).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('GetRevenueReportUseCase', () => {
    it('should aggregate revenue report correctly', async () => {
      const useCase = new GetRevenueReportUseCase(reportsRepo);
      reportsRepo.getRevenueByCategory.mockResolvedValue([
        { category: 'A', revenue: 100, count: 5 }
      ]);
      reportsRepo.getRevenueBySet.mockResolvedValue([]);

      const result = await useCase.execute({ tenantId });
      expect(result.totalRevenue).toBe(100);
      expect(result.totalItemsSold).toBe(5);
    });
  });

  describe('GetSalesSourceReportUseCase', () => {
    it('should return sales by source', async () => {
      const useCase = new GetSalesSourceReportUseCase(reportsRepo);
      await useCase.execute({ tenantId });
      expect(reportsRepo.getSalesBySource).toHaveBeenCalledWith(tenantId, undefined, undefined);
    });
  });

  describe('GetTopSellingProductsUseCase', () => {
    it('should return top products', async () => {
      const useCase = new GetTopSellingProductsUseCase(reportsRepo);
      await useCase.execute({ tenantId, limit: 10 });
      expect(reportsRepo.getTopSellingProducts).toHaveBeenCalledWith(tenantId, 10);
    });
  });

  describe('GetInventoryValuationUseCase', () => {
    it('should call repository for inventory valuation', async () => {
      const useCase = new GetInventoryValuationUseCase(reportsRepo);
      await useCase.execute(tenantId);
      expect(reportsRepo.getInventoryValuationBySet).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('GetInventoryReportUseCase', () => {
    it('should call repository for inventory distribution', async () => {
      const useCase = new GetInventoryReportUseCase(reportsRepo);
      await useCase.execute(tenantId);
      expect(reportsRepo.getInventoryConditionDistribution).toHaveBeenCalledWith(tenantId);
    });
  });
});
