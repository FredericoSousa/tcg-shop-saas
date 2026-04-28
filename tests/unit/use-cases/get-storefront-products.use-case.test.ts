import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, Prisma } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  prisma: mockDeep<PrismaClient>(),
}));

import { prisma as prismaMock } from '@/lib/prisma';
import { GetStorefrontProductsUseCase } from '@/lib/application/use-cases/storefront/get-storefront-products.use-case';

const TENANT_ID = 'tenant-1';

const makeCategory = (overrides: Partial<{ id: string; name: string; showOnEcommerce: boolean }> = {}) => ({
  id: overrides.id ?? 'cat-1',
  name: overrides.name ?? 'Acessórios',
  description: null,
  showOnEcommerce: overrides.showOnEcommerce ?? true,
  tenantId: TENANT_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
});

const makeProduct = (overrides: Partial<{ id: string; name: string; price: number; categoryId: string }> = {}, category = makeCategory()) => ({
  id: overrides.id ?? 'prod-1',
  name: overrides.name ?? 'Sleeve Dragon Shield',
  description: 'Descrição',
  imageUrl: 'https://example.com/img.jpg',
  price: new Prisma.Decimal(overrides.price ?? 29.99),
  stock: 10,
  active: true,
  allowNegativeStock: false,
  categoryId: overrides.categoryId ?? category.id,
  tenantId: TENANT_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  category,
});

describe('GetStorefrontProductsUseCase', () => {
  let useCase: GetStorefrontProductsUseCase;

  beforeEach(() => {
    mockReset(prismaMock);
    useCase = new GetStorefrontProductsUseCase();
  });

  it('should return products and categories for a tenant', async () => {
    const category = makeCategory();
    const product = makeProduct({}, category);

    (prismaMock.product.findMany as any).mockResolvedValue([product]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([category]);

    const result = await useCase.execute(TENANT_ID);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('prod-1');
    expect(result.items[0].price).toBe(29.99);
    expect(result.items[0].category?.name).toBe('Acessórios');
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].id).toBe('cat-1');
  });

  it('should query only products from ecommerce-enabled categories', async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    await useCase.execute(TENANT_ID);

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          active: true,
          deletedAt: null,
          category: expect.objectContaining({
            showOnEcommerce: true,
            deletedAt: null,
          }),
        }),
      })
    );
  });

  it('should query only categories with showOnEcommerce = true', async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    await useCase.execute(TENANT_ID);

    expect(prismaMock.productCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          tenantId: TENANT_ID,
          showOnEcommerce: true,
          deletedAt: null,
        }),
      })
    );
  });

  it('should apply search filter to product query', async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    await useCase.execute(TENANT_ID, { search: 'dragon' });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: 'dragon', mode: 'insensitive' },
        }),
      })
    );
  });

  it('should apply categoryId filter to product query', async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    await useCase.execute(TENANT_ID, { categoryId: 'cat-42' });

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          categoryId: 'cat-42',
        }),
      })
    );
  });

  it('should return empty results when no products exist', async () => {
    (prismaMock.product.findMany as any).mockResolvedValue([]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    const result = await useCase.execute(TENANT_ID);

    expect(result.items).toEqual([]);
    expect(result.categories).toEqual([]);
  });

  it('should map Prisma Decimal price to number', async () => {
    const product = makeProduct({ price: 99.99 });
    (prismaMock.product.findMany as any).mockResolvedValue([product]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    const result = await useCase.execute(TENANT_ID);

    expect(typeof result.items[0].price).toBe('number');
    expect(result.items[0].price).toBe(99.99);
  });

  it('should return product without category when category is null', async () => {
    const productWithoutCategory = { ...makeProduct(), category: null };
    (prismaMock.product.findMany as any).mockResolvedValue([productWithoutCategory]);
    (prismaMock.productCategory.findMany as any).mockResolvedValue([]);

    const result = await useCase.execute(TENANT_ID);

    expect(result.items[0].category).toBeUndefined();
  });
});
