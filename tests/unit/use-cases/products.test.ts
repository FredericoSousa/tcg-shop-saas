import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SaveProductUseCase } from '@/lib/application/use-cases/save-product.use-case';
import { GetProductUseCase } from '@/lib/application/use-cases/get-product.use-case';
import { ListProductsUseCase } from '@/lib/application/use-cases/list-products.use-case';
import { ListCategoriesUseCase } from '@/lib/application/use-cases/list-categories.use-case';
import { SaveCategoryUseCase } from '@/lib/application/use-cases/save-category.use-case';
import type { IProductRepository } from '@/lib/domain/repositories/product.repository';

vi.mock('../../tenant-context', () => ({
  getTenantId: vi.fn(() => 'test-tenant-id'),
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
      await useCase.execute({ name: 'P1', price: 10, stock: 5, categoryId: 'cat1' });
      expect(productRepo.save).toHaveBeenCalled();
    });

    it('should update an existing product', async () => {
      const useCase = new SaveProductUseCase(productRepo);
      await useCase.execute({ id: 'p1', name: 'New P1', price: 20, stock: 10, categoryId: 'cat1' });
      expect(productRepo.update).toHaveBeenCalledWith('p1', expect.anything());
    });
  });

  describe('GetProductUseCase', () => {
    it('should find product by id', async () => {
      const useCase = new GetProductUseCase(productRepo);
      await useCase.execute('p1');
      expect(productRepo.findById).toHaveBeenCalledWith('p1');
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

  describe('ListCategoriesUseCase', () => {
    it('should list categories', async () => {
      const useCase = new ListCategoriesUseCase(productRepo);
      await useCase.execute();
      expect(productRepo.findCategories).toHaveBeenCalled();
    });
  });

  describe('SaveCategoryUseCase', () => {
     it('should create category', async () => {
      const useCase = new SaveCategoryUseCase(productRepo);
      await useCase.execute({ name: 'Cat1' });
      expect(productRepo.saveCategory).toHaveBeenCalled();
    });
  });
});
