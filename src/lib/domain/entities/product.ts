export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  showOnEcommerce: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  stock: number;
  active: boolean;
  allowNegativeStock: boolean;
  categoryId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  category?: ProductCategory;
}
