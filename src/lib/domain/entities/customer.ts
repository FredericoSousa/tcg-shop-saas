export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface CustomerStats {
  totalSpent: number;
  totalOrders: number;
}
