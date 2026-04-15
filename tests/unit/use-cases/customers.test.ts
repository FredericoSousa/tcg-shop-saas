import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { CreateCustomerUseCase } from '@/lib/application/use-cases/create-customer.use-case';
import { GetCustomerUseCase } from '@/lib/application/use-cases/get-customer.use-case';
import { ListCustomersUseCase } from '@/lib/application/use-cases/list-customers.use-case';
import { LookupCustomerUseCase } from '@/lib/application/use-cases/lookup-customer.use-case';
import { UpdateCustomerUseCase } from '@/lib/application/use-cases/update-customer.use-case';
import { GetCustomerInsightsUseCase } from '@/lib/application/use-cases/get-customer-insights.use-case';
import { GetCustomerRankingUseCase } from '@/lib/application/use-cases/get-customer-ranking.use-case';
import { AdjustCustomerCreditUseCase } from '@/lib/application/use-cases/adjust-customer-credit.use-case';
import { DeleteCustomerUseCase } from '@/lib/application/use-cases/delete-customer.use-case';
import { GetCustomerCreditHistoryUseCase } from '@/lib/application/use-cases/get-customer-credit-history.use-case';
import { GetCustomerOrdersUseCase } from '@/lib/application/use-cases/get-customer-orders.use-case';
import type { ICustomerRepository } from '@/lib/domain/repositories/customer.repository';
import type { IReportsRepository } from '@/lib/domain/repositories/report.repository';
import type { ICustomerCreditLedgerRepository } from '@/lib/domain/repositories/customer-credit-ledger.repository';
import type { IOrderRepository } from '@/lib/domain/repositories/order.repository';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn((callback) => callback('mock-tx')),
  },
}));

describe('Customer Use Cases', () => {
  let customerRepo: MockProxy<ICustomerRepository>;
  let reportsRepo: MockProxy<IReportsRepository>;
  let ledgerRepo: MockProxy<ICustomerCreditLedgerRepository>;
  let orderRepo: MockProxy<IOrderRepository>;

  beforeEach(() => {
    customerRepo = mock<ICustomerRepository>();
    reportsRepo = mock<IReportsRepository>();
    ledgerRepo = mock<ICustomerCreditLedgerRepository>();
    orderRepo = mock<IOrderRepository>();
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
    it('should return Whale tier for LTV > 5000', async () => {
      const useCase = new GetCustomerInsightsUseCase(reportsRepo);
      reportsRepo.getCustomerLTV.mockResolvedValue(6000);
      const result = await useCase.execute({ tenantId: 't1', customerId: 'c1' });
      expect(result.tier).toBe('Whale');
    });

    it('should return VIP tier for LTV > 1000', async () => {
      const useCase = new GetCustomerInsightsUseCase(reportsRepo);
      reportsRepo.getCustomerLTV.mockResolvedValue(2000);
      const result = await useCase.execute({ tenantId: 't1', customerId: 'c1' });
      expect(result.tier).toBe('VIP');
    });

    it('should return Frequente tier for LTV > 500', async () => {
      const useCase = new GetCustomerInsightsUseCase(reportsRepo);
      reportsRepo.getCustomerLTV.mockResolvedValue(600);
      const result = await useCase.execute({ tenantId: 't1', customerId: 'c1' });
      expect(result.tier).toBe('Frequente');
    });

    it('should return Standard tier for low LTV', async () => {
      const useCase = new GetCustomerInsightsUseCase(reportsRepo);
      reportsRepo.getCustomerLTV.mockResolvedValue(100);
      const result = await useCase.execute({ tenantId: 't1', customerId: 'c1' });
      expect(result.tier).toBe('Standard');
    });
  });

  describe('GetCustomerRankingUseCase', () => {
    it('should return top customers', async () => {
      const useCase = new GetCustomerRankingUseCase(reportsRepo);
      await useCase.execute({ tenantId: 't1', limit: 3 });
      expect(reportsRepo.getTopCustomersByLTV).toHaveBeenCalledWith('t1', 3);
    });
  });

  describe('AdjustCustomerCreditUseCase', () => {
    it('should adjust credit balance correctly', async () => {
      const useCase = new AdjustCustomerCreditUseCase(customerRepo, ledgerRepo);
      customerRepo.findById.mockResolvedValue({ id: 'c1', creditBalance: 10 } as any);
      ledgerRepo.computeBalance.mockResolvedValue(10);

      await useCase.execute({ customerId: 'c1', amount: 5, description: 'Bonus' });

      expect(customerRepo.updateCreditBalance).toHaveBeenCalledWith('c1', 5, 'mock-tx');
      expect(ledgerRepo.save).toHaveBeenCalled();
    });

    it('should throw error on insufficient balance for debit', async () => {
      const useCase = new AdjustCustomerCreditUseCase(customerRepo, ledgerRepo);
      customerRepo.findById.mockResolvedValue({ id: 'c1', creditBalance: 10 } as any);
      ledgerRepo.computeBalance.mockResolvedValue(10);

      await expect(useCase.execute({ customerId: 'c1', amount: -15, description: 'Debit' }))
        .rejects.toThrow('Saldo insuficiente de créditos.');
    });
  });

  describe('DeleteCustomerUseCase', () => {
    it('should soft delete a customer', async () => {
      const useCase = new DeleteCustomerUseCase(customerRepo);
      await useCase.execute({ id: 'c1' });
      expect(customerRepo.delete).toHaveBeenCalledWith('c1');
    });
  });

  describe('GetCustomerCreditHistoryUseCase', () => {
    it('should return credit ledger items', async () => {
      const useCase = new GetCustomerCreditHistoryUseCase(ledgerRepo);
      ledgerRepo.findByCustomerId.mockResolvedValue([]);
      await useCase.execute({ customerId: 'c1' });
      expect(ledgerRepo.findByCustomerId).toHaveBeenCalledWith('c1');
    });
  });

  describe('GetCustomerOrdersUseCase', () => {
    it('should return customer orders', async () => {
      const useCase = new GetCustomerOrdersUseCase(orderRepo);
      orderRepo.findPaginated.mockResolvedValue({ items: [], total: 0 });
      await useCase.execute({ customerId: 'c1', page: 1, limit: 10 });
      expect(orderRepo.findPaginated).toHaveBeenCalledWith(1, 10, { customerId: 'c1' });
    });
  });
});
