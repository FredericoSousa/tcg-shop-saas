import { 
    RevenueByCategory, 
    RevenueBySet, 
    TopSellingProduct,
    SalesBySource,
    InventoryConditionDistribution,
    CustomerLTV,
    MonthlyRevenue,
    InventoryValuation
} from "../entities/report";

export abstract class IReportsRepository {
    abstract getRevenueByCategory(tenantId: string, startDate?: Date, endDate?: Date): Promise<RevenueByCategory[]>;
    abstract getRevenueBySet(tenantId: string, startDate?: Date, endDate?: Date): Promise<RevenueBySet[]>;
    abstract getTopSellingProducts(tenantId: string, limit?: number): Promise<TopSellingProduct[]>;
    abstract getCustomerLTV(tenantId: string, customerId: string): Promise<number>;
    abstract getSalesBySource(tenantId: string, startDate?: Date, endDate?: Date): Promise<SalesBySource[]>;
    abstract getInventoryConditionDistribution(tenantId: string): Promise<InventoryConditionDistribution[]>;
    abstract getTopCustomersByLTV(tenantId: string, limit?: number): Promise<CustomerLTV[]>;
    abstract getMonthlyRevenueTrend(tenantId: string): Promise<MonthlyRevenue[]>;
    abstract getInventoryValuationBySet(tenantId: string): Promise<InventoryValuation[]>;
}