import { describe, it, expect, beforeEach } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { GetInventoryReportUseCase } from '@/lib/application/use-cases/get-inventory-report.use-case';
import { GetInventoryValuationUseCase } from '@/lib/application/use-cases/get-inventory-valuation.use-case';
import type { IReportsRepository } from '@/lib/domain/repositories/report.repository';

describe('Inventory Reporting Use Cases', () => {
  let reportsRepo: MockProxy<IReportsRepository>;
  const tenantId = 'test-tenant-id';

  beforeEach(() => {
    reportsRepo = mock<IReportsRepository>();
  });

  describe('GetInventoryReportUseCase', () => {
    it('should return inventory distribution', async () => {
      const useCase = new GetInventoryReportUseCase(reportsRepo);
      const mockData = [{ condition: 'NM', count: 10 }];
      reportsRepo.getInventoryConditionDistribution.mockResolvedValue(mockData);

      const result = await useCase.execute(tenantId);
      expect(result).toEqual(mockData);
      expect(reportsRepo.getInventoryConditionDistribution).toHaveBeenCalledWith(tenantId);
    });
  });

  describe('GetInventoryValuationUseCase', () => {
    it('should return inventory valuation', async () => {
      const useCase = new GetInventoryValuationUseCase(reportsRepo);
      const mockData = [{ set: 'Set A', value: 100, count: 10 }];
      reportsRepo.getInventoryValuationBySet.mockResolvedValue(mockData);

      const result = await useCase.execute(tenantId);
      expect(result).toEqual(mockData);
      expect(reportsRepo.getInventoryValuationBySet).toHaveBeenCalledWith(tenantId);
    });
  });
});
