export interface RevenueByCategory {
  category: string;
  count: number;
  revenue: number;
}

export interface RevenueBySet {
  set: string;
  count: number;
  revenue: number;
}

export interface TopSellingProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  count: number;
  revenue: number;
}

export interface RevenueReport {
  byCategory: RevenueByCategory[];
  bySet: RevenueBySet[];
  totalRevenue: number;
  totalItemsSold: number;
}

export interface CustomerInsight {
  ltv: number;
  tier: string;
  segments: string[];
}

export interface SalesBySource {
  source: string;
  count: number;
  revenue: number;
}

export interface InventoryConditionDistribution {
  condition: string;
  count: number;
}

export interface CustomerLTV {
  id: string;
  name: string;
  phoneNumber: string;
  totalSpent: number;
  orderCount: number;
}

export interface MonthlyRevenue {
  month: string; // "Jan", "Fev", etc.
  revenue: number;
}

export interface InventoryValuation {
  set: string;
  value: number;
  count: number;
}


