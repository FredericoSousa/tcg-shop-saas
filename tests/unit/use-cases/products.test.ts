import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SaveProductUseCase } from '@/lib/application/use-cases/products/save-product.use-case';
import { GetProductUseCase } from '@/lib/application/use-cases/products/get-product.use-case';
import { ListProductsUseCase } from '@/lib/application/use-cases/products/list-products.use-case';
import { ListCategoriesUseCase } from '@/lib/application/use-cases/products/list-categories.use-case';
import { SaveCategoryUseCase } from '@/lib/application/use-cases/products/save-category.use-case';
import { DeleteProductUseCase } from '@/lib/application/use-cases/products/delete-product.use-case';
import type { IProductRepository } from '@/lib/domain/repositories/product.repository';
import type { IAuditLogRepository } from '@/lib/domain/repositories/audit-log.repository';

vi.mock('../../tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
}));

vi.mock('@/lib/domain/events/domain-events', () => ({
  domainEvents: {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn(),
  },
  DOMAIN_EVENTS: {
    PRODUCT_SAVED: 'product.saved',
    PRODUCT_DELETED: 'product.deleted',
  }
}));

describe('Product & Category Use Cases', () => {
  let productRepo: MockProxy<IProductRepository>;

  beforeEach(() => {
    productRepo = mock<IProductRepository>();
    vi.clearAllMocks();
  });

  describe('SaveProductUseCase', () => {
    it('should create a new product', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      productRepo.save.mockResolvedValue({ id: 'p1', tenantId: 't1', name: 'P1', price: 10, stock: 5 } as any);
      
      await useCase.execute({ name: 'P1', price: 10, stock: 5, categoryId: 'cat1', allowNegativeStock: false });
      
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should update an existing product', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      productRepo.update.mockResolvedValue({ id: 'p1', tenantId: 't1', name: 'New P1', price: 20, stock: 10 } as any);
      
      await useCase.execute({ id: 'p1', name: 'New P1', price: 20, stock: 10, categoryId: 'cat1', allowNegativeStock: false });
      
      expect(productRepo.update).toHaveBeenCalledWith('p1', expect.anything());
    });

    it('should fail with invalid price', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      await expect(useCase.execute({ name: 'P1', price: -10, stock: 5, categoryId: 'cat1', allowNegativeStock: false }))
        .rejects.toThrow();
    });

    it('should fail with invalid imageUrl', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      await expect(useCase.execute({ name: 'P1', price: 10, stock: 5, categoryId: 'cat1', allowNegativeStock: false, imageUrl: 'invalid-url' }))
        .rejects.toThrow();
    });

    it('should fail with empty name', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      await expect(useCase.execute({ name: '', price: 10, stock: 5, categoryId: 'cat1', allowNegativeStock: false }))
        .rejects.toThrow();
    });

    it('should fail with invalid stock', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      await expect(useCase.execute({ name: 'P1', price: 10, stock: -5, categoryId: 'cat1', allowNegativeStock: false }))
        .rejects.toThrow();
    });

    it('should fail with missing category', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      await expect(useCase.execute({ name: 'P1', price: 10, stock: 5, categoryId: '', allowNegativeStock: false }))
        .rejects.toThrow();
    });

    it('should handle repository errors', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      productRepo.save.mockRejectedValue(new Error('DB Error'));
      await expect(useCase.execute({ name: 'P1', price: 10, stock: 5, categoryId: 'cat1', allowNegativeStock: false }))
        .rejects.toThrow('DB Error');
    });
  });

  describe('GetProductUseCase', () => {
    it('should find product by id', async () => {
      const useCase = new GetProductUseCase(productRepo);
      await useCase.execute('p1');
      expect(productRepo.findById).toHaveBeenCalledWith('p1');
    });

    it('should return null if product not found', async () => {
      const useCase = new GetProductUseCase(productRepo);
      productRepo.findById.mockResolvedValue(null);
      const result = await useCase.execute('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('ListProductsUseCase', () => {
    it('should return paginated products', async () => {
      const useCase = new ListProductsUseCase(productRepo);
      productRepo.findPaginated.mockResolvedValue({ items: [], total: 20 });
      const result = await useCase.execute({ page: 1, limit: 10 });
      expect(result.pageCount).toBe(2);
    });
  });

  describe('SaveCategoryUseCase', () => {
    it('should create category', async () => {
      const useCase = new SaveCategoryUseCase(productRepo);
      await useCase.execute({ name: 'Cat1' });
      expect(productRepo.saveCategory).toHaveBeenCalled();
    });

    it('should fail with empty category name', async () => {
      const useCase = new SaveCategoryUseCase(productRepo);
      await expect(useCase.execute({ name: '' }))
        .rejects.toThrow();
    });

    it('should update existing category', async () => {
      const useCase = new SaveCategoryUseCase(productRepo);
      await useCase.execute({ id: 'cat1', name: 'Updated Cat' });
      expect(productRepo.updateCategory).toHaveBeenCalledWith('cat1', { name: 'Updated Cat' });
    });
  });

  describe('ListCategoriesUseCase', () => {
    it('should return categories from repository', async () => {
      const useCase = new ListCategoriesUseCase(productRepo);
      productRepo.findCategories.mockResolvedValue([]);
      const result = await useCase.execute();
      expect(result).toEqual([]);
      expect(productRepo.findCategories).toHaveBeenCalled();
    });
  });

  describe('DeleteProductUseCase', () => {
    it('should call repository delete and write an audit entry', async () => {
      const auditLog = mock<IAuditLogRepository>();
      const useCase = new DeleteProductUseCase(productRepo, auditLog);
      await useCase.execute({ id: 'p1', actorId: 'u1' });
      expect(productRepo.delete).toHaveBeenCalledWith('p1');
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELETE', entityType: 'product', entityId: 'p1' }),
      );
    });
  });
});
