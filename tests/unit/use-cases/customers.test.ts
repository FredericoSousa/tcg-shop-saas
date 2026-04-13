import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { CreateCustomerUseCase } from '@/lib/application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '@/lib/application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '@/lib/application/use-cases/list-customers.use-case';
import { LookupCustomerUseCase } from '@/lib/application/use-cases/lookup-customer.use-case';
import { UpdateCustomerUseCase } from '@/lib/application/use-cases/update-customer.use-case';
import { GetCustomerInsightsUseCase } from '@/lib/application/use-cases/get-customer-insights.use-case';
import { GetCustomerRankingUseCase } from '@/lib/application/use-cases/get-customer-ranking.use-case';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';
import type { IReportsRepository } from '@/lib/domain/repositories/report.repository';

vi.mock('../../tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

describe('Customer Use Cases', () => {
  let customerRepo: MockProxy<ICustomerRepository>;
  let reportsRepo: MockProxy<IReportsRepository>;

  beforeEach(() => {
    customerRepo = mock<ICustomerRepository>();
    reportsRepo = mock<IReportsRepository>();
    vi.clearAllMocks();
  });

  describe('CreateCustomerUseCase', () => {
    it('should create a customer correctly', async () => {
      const useCase = new CreateCustomerUseCase(customerRepo);
      await useCase.execute({ name: 'Test', phoneNumber: '123' });
      expect(customerRepo.save).toHaveBeenCalled();
    });
  });

  describe('GetCustomerUseCase', () => {
    it('should return customer and stats', async () => {
      const useCase = new GetCustomerUseCase(customerRepo);
      customerRepo.findById.mockResolvedValue({ id: '1' } as any);
      customerRepo.getStats.mockResolvedValue({ totalSpent: 100, totalOrders: 1 });

      const result = await useCase.execute('1');
      expect(result?.customer.id).toBe('1');
      expect(result?.stats.totalSpent).toBe(100);
    });
  });

  describe('ListCustomersUseCase', () => {
    it('should return paginated customers', async () => {
      const useCase = new ListCustomersUseCase(customerRepo);
      customerRepo.findPaginated.mockResolvedValue({ items: [], total: 10 });

      const result = await useCase.execute({ page: 1, limit: 5, filters: {} });
      expect(result.total).toBe(10);
      expect(result.pageCount).toBe(2);
    });
  });

  describe('LookupCustomerUseCase', () => {
    it('should find customer by phone', async () => {
      const useCase = new LookupCustomerUseCase(customerRepo);
      await useCase.execute('123');
      expect(customerRepo.findByPhoneNumber).toHaveBeenCalledWith('123');
    });
  });

  describe('UpdateCustomerUseCase', () => {
    it('should update customer data', async () => {
      const useCase = new UpdateCustomerUseCase(customerRepo);
      await useCase.execute({ id: '1', name: 'New Name' });
      expect(customerRepo.update).toHaveBeenCalledWith('1', { name: 'New Name' });
    });
  });

  describe('GetCustomerInsightsUseCase', () => {
    it('should return correct tier based on LTV', async () => {
      const useCase = new GetCustomerInsightsUseCase(reportsRepo);
      reportsRepo.getCustomerLTV.mockResolvedValue(2000);

      const result = await useCase.execute({ tenantId: 't1', customerId: 'c1' });
      expect(result.tier).toBe('VIP');
    });
  });

  describe('GetCustomerRankingUseCase', () => {
    it('should return top customers', async () => {
      const useCase = new GetCustomerRankingUseCase(reportsRepo);
      await useCase.execute({ tenantId: 't1', limit: 3 });
      expect(reportsRepo.getTopCustomersByLTV).toHaveBeenCalledWith('t1', 3);
    });
  });
});
