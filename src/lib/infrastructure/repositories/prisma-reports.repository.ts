import { injectable } from "tsyringe";
import { Prisma } from "@prisma/client";
import { BasePrismaRepository } from "./base-prisma.repository";
import {
  RevenueByCategory,
  RevenueBySet,
  TopSellingProduct,
  SalesBySource,
  InventoryConditionDistribution,
  CustomerLTV,
  MonthlyRevenue,
  InventoryValuation
} from "@/lib/domain/entities/report";
import { IReportsRepository } from "@/lib/domain/repositories/report.repository";

interface RevenueByCategoryRow {
  category: string;
  count: number;
  revenue: number;
}

interface RevenueBySetRow {
  set: string;
  count: number;
  revenue: number;
}

interface TopSellingProductRow {
  id: string;
  name: string;
  image_url: string | null;
  count: number;
  revenue: number;
}

@injectable()
export class PrismaReportsRepository extends BasePrismaRepository implements IReportsRepository {
  private cache = new Map<string, { data: any; expiry: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL_MS
    });
  }

  async getRevenueByCategory(tenantId: string, startDate?: Date, endDate?: Date): Promise<RevenueByCategory[]> {
    const startDateFilter = startDate ? Prisma.sql`AND o.created_at >= ${startDate}` : Prisma.empty;
    const endDateFilter = endDate ? Prisma.sql`AND o.created_at <= ${endDate}` : Prisma.empty;

    const rawResults = await this.prisma.$queryRaw<RevenueByCategoryRow[]>`
      SELECT 
        c.name as category,
        SUM(oi.quantity)::int as count,
        SUM(oi.quantity * oi.price_at_purchase)::float as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN products p ON p.id = oi.product_id
      JOIN product_categories c ON c.id = p.category_id
      WHERE o.tenant_id = ${tenantId}::uuid
        AND o.status != 'CANCELLED'
        ${startDateFilter}
        ${endDateFilter}
      GROUP BY c.name
      
      UNION ALL
      
      SELECT 
        'Singles' as category,
        SUM(oi.quantity)::int as count,
        SUM(oi.quantity * oi.price_at_purchase)::float as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.tenant_id = ${tenantId}::uuid
        AND o.status != 'CANCELLED'
        AND oi.inventory_item_id IS NOT NULL
        ${startDateFilter}
        ${endDateFilter}
    `;

    return rawResults.map((r: RevenueByCategoryRow) => ({
      category: r.category,
      count: Number(r.count),
      revenue: Number(r.revenue)
    }));
  }

  async getRevenueBySet(tenantId: string, startDate?: Date, endDate?: Date): Promise<RevenueBySet[]> {
    const startDateFilter = startDate ? Prisma.sql`AND o.created_at >= ${startDate}` : Prisma.empty;
    const endDateFilter = endDate ? Prisma.sql`AND o.created_at <= ${endDate}` : Prisma.empty;

    const rawResults = await this.prisma.$queryRaw<RevenueBySetRow[]>`
      SELECT 
        ct.set as "set",
        SUM(oi.quantity)::int as count,
        SUM(oi.quantity * oi.price_at_purchase)::float as revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      JOIN inventory_items ii ON ii.id = oi.inventory_item_id
      JOIN card_templates ct ON ct.id = ii.card_template_id
      WHERE o.tenant_id = ${tenantId}::uuid
        AND o.status != 'CANCELLED'
        ${startDateFilter}
        ${endDateFilter}
      GROUP BY ct.set
      ORDER BY revenue DESC
    `;

    return rawResults.map((r: RevenueBySetRow) => ({
      set: r.set,
      count: Number(r.count),
      revenue: Number(r.revenue)
    }));
  }

  async getTopSellingProducts(tenantId: string, limit: number = 10): Promise<TopSellingProduct[]> {
    const rawResults = await this.prisma.$queryRaw<TopSellingProductRow[]>`
      WITH sold_items AS (
        SELECT 
          p.id,
          p.name,
          p.image_url,
          SUM(oi.quantity)::int as count,
          SUM(oi.quantity * oi.price_at_purchase)::float as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN products p ON p.id = oi.product_id
        WHERE o.tenant_id = ${tenantId}::uuid AND o.status != 'CANCELLED'
        GROUP BY p.id, p.name, p.image_url
        
        UNION ALL
        
        SELECT 
          ct.id,
          ct.name,
          ct.image_url,
          SUM(oi.quantity)::int as count,
          SUM(oi.quantity * oi.price_at_purchase)::float as revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        JOIN inventory_items ii ON ii.id = oi.inventory_item_id
        JOIN card_templates ct ON ct.id = ii.card_template_id
        WHERE o.tenant_id = ${tenantId}::uuid AND o.status != 'CANCELLED'
        GROUP BY ct.id, ct.name, ct.image_url
      )
      SELECT * FROM sold_items
      ORDER BY revenue DESC
      LIMIT ${limit}
    `;

    return rawResults.map((r: TopSellingProductRow) => ({
      id: r.id,
      name: r.name,
      imageUrl: r.image_url,
      count: Number(r.count),
      revenue: Number(r.revenue)
    }));
  }

  async getCustomerLTV(tenantId: string, customerId: string): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        tenantId,
        customerId,
        status: { not: 'CANCELLED' }
      },
      _sum: {
        totalAmount: true
      }
    });

    return Number(result._sum.totalAmount || 0);
  }

  async getSalesBySource(tenantId: string, startDate?: Date, endDate?: Date): Promise<SalesBySource[]> {
    const results = await this.prisma.order.groupBy({
      by: ['source'],
      where: {
        tenantId,
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    });

    return results.map((r) => ({
      source: r.source,
      count: r._count.id,
      revenue: Number(r._sum.totalAmount || 0)
    }));
  }

  async getInventoryConditionDistribution(tenantId: string): Promise<InventoryConditionDistribution[]> {
    const results = await this.prisma.inventoryItem.groupBy({
      by: ['condition'],
      where: {
        tenantId,
        active: true
      },
      _count: {
        id: true
      }
    });

    return results.map((r) => ({
      condition: r.condition,
      count: r._count.id
    }));
  }


  async getTopCustomersByLTV(tenantId: string, limit: number = 5): Promise<CustomerLTV[]> {
    const results = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        tenantId,
        status: { not: 'CANCELLED' }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: limit
    });

    const customerIds = results.map((r) => r.customerId);
    const customers = await this.prisma.customer.findMany({
      where: {
        id: { in: customerIds }
      }
    });

    return results.map((r) => {
      const customer = customers.find(c => c.id === r.customerId);
      return {
        id: r.customerId,
        name: customer?.name || 'Desconhecido',
        phoneNumber: customer?.phoneNumber || '',
        totalSpent: Number(r._sum.totalAmount || 0),
        orderCount: r._count.id
      };
    });
  }


  async getMonthlyRevenueTrend(tenantId: string): Promise<MonthlyRevenue[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const rawResults = await this.prisma.$queryRaw<{ month_label: string; revenue: number; month_date: Date }[]>`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month_label,
        SUM(total_amount)::float as revenue,
        DATE_TRUNC('month', created_at) as month_date
      FROM orders
      WHERE tenant_id = ${tenantId}::uuid
        AND status != 'CANCELLED'
        AND created_at >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month_date ASC
    `;

    // Map labels to translate or format if needed, though SQL does most work
    const monthsMap: Record<string, string> = {
      'Jan': 'Jan', 'Feb': 'Fev', 'Mar': 'Mar', 'Apr': 'Abr', 'May': 'Mai', 'Jun': 'Jun',
      'Jul': 'Jul', 'Aug': 'Ago', 'Sep': 'Set', 'Oct': 'Out', 'Nov': 'Nov', 'Dec': 'Dez'
    };

    return rawResults.map(r => ({
      month: monthsMap[r.month_label] || r.month_label,
      revenue: Number(r.revenue)
    }));
  }

  async getInventoryValuationBySet(tenantId: string): Promise<InventoryValuation[]> {
    const cacheKey = `valuation_${tenantId}`;
    const cached = this.getCached<InventoryValuation[]>(cacheKey);
    if (cached) return cached;

    const rawResults = await this.prisma.$queryRaw<{ set: string; value: number; count: number }[]>`
      SELECT 
        ct.set as "set",
        SUM(ii.price * ii.quantity)::float as value,
        SUM(ii.quantity)::int as count
      FROM inventory_items ii
      JOIN card_templates ct ON ct.id = ii.card_template_id
      WHERE ii.tenant_id = ${tenantId}::uuid
        AND ii.active = true
        AND ii.quantity > 0
      GROUP BY ct.set
      ORDER BY value DESC
      LIMIT 10
    `;

    const results = rawResults.map(r => ({
      set: r.set,
      value: Number(r.value),
      count: Number(r.count)
    }));

    this.setCache(cacheKey, results);
    return results;
  }

  async getWeeklyRevenue(tenantId: string): Promise<{ day: string; amount: number }[]> {
    const cacheKey = `weekly_${tenantId}`;
    const cached = this.getCached<{ day: string; amount: number }[]>(cacheKey);
    if (cached) return cached;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const rawResults = await this.prisma.$queryRaw<{ day_of_week: string; amount: number }[]>`
      SELECT 
        TO_CHAR(created_at, 'D') as day_of_week,
        SUM(total_amount)::float as amount
      FROM orders
      WHERE tenant_id = ${tenantId}::uuid
        AND status != 'CANCELLED'
        AND created_at >= ${sevenDaysAgo}
      GROUP BY DATE_TRUNC('day', created_at), TO_CHAR(created_at, 'D')
      ORDER BY DATE_TRUNC('day', created_at) ASC
    `;

    const dayNames: Record<string, string> = {
      '1': 'Dom', '2': 'Seg', '3': 'Ter', '4': 'Qua', '5': 'Qui', '6': 'Sex', '7': 'Sáb'
    };

    const results = rawResults.map(r => ({
      day: dayNames[r.day_of_week] || r.day_of_week,
      amount: Number(r.amount)
    }));

    this.setCache(cacheKey, results);
    return results;
  }
}
