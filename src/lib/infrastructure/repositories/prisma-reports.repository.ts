import { injectable } from "tsyringe";
import { prisma } from "../../prisma";
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

@injectable()
export class PrismaReportsRepository implements IReportsRepository {
  async getRevenueByCategory(tenantId: string, startDate?: Date, endDate?: Date): Promise<RevenueByCategory[]> {
    // For products with categories
    const results = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          tenantId,
          status: { not: 'CANCELLED' },
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        productId: { not: null }
      },
      _sum: {
        quantity: true,
        priceAtPurchase: true
      }
    });

    // This is a bit simplified, but for a real "Category" report we'd need to join.
    // I'll use queryRaw to get it in one shot including categories and card sets.
    
    const rawResults = await prisma.$queryRaw<any[]>`
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
        ${startDate ? `AND o.created_at >= ${startDate}` : ''}
        ${endDate ? `AND o.created_at <= ${endDate}` : ''}
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
        ${startDate ? `AND o.created_at >= ${startDate}` : ''}
        ${endDate ? `AND o.created_at <= ${endDate}` : ''}
    `;

    return rawResults.map(r => ({
      category: r.category,
      count: Number(r.count),
      revenue: Number(r.revenue)
    }));
  }

  async getRevenueBySet(tenantId: string, startDate?: Date, endDate?: Date): Promise<RevenueBySet[]> {
    const rawResults = await prisma.$queryRaw<any[]>`
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
        ${startDate ? `AND o.created_at >= ${startDate}` : ''}
        ${endDate ? `AND o.created_at <= ${endDate}` : ''}
      GROUP BY ct.set
      ORDER BY revenue DESC
    `;

    return rawResults.map(r => ({
      set: r.set,
      count: Number(r.count),
      revenue: Number(r.revenue)
    }));
  }

  async getTopSellingProducts(tenantId: string, limit: number = 10): Promise<TopSellingProduct[]> {
    // Combine inventory items (cards) and products
    const rawResults = await prisma.$queryRaw<any[]>`
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

    return rawResults.map(r => ({
      id: r.id,
      name: r.name,
      imageUrl: r.image_url,
      count: Number(r.count),
      revenue: Number(r.revenue)
    }));
  }

  async getCustomerLTV(tenantId: string, customerId: string): Promise<number> {
    const result = await prisma.order.aggregate({
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
    const results = await prisma.order.groupBy({
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

    return results.map(r => ({
      source: r.source,
      count: r._count.id,
      revenue: Number(r._sum.totalAmount || 0)
    }));
  }

  async getInventoryConditionDistribution(tenantId: string): Promise<InventoryConditionDistribution[]> {
    const results = await prisma.inventoryItem.groupBy({
      by: ['condition'],
      where: {
        tenantId,
        active: true
      },
      _count: {
        id: true
      }
    });

    return results.map(r => ({
      condition: r.condition,
      count: r._count.id
    }));
  }

  async getTopCustomersByLTV(tenantId: string, limit: number = 5): Promise<CustomerLTV[]> {
    const results = await prisma.order.groupBy({
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

    const customers = await prisma.customer.findMany({
      where: {
        id: { in: results.map(r => r.customerId) }
      }
    });

    return results.map(r => {
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

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        status: { not: 'CANCELLED' },
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    const monthlyData: Record<string, number> = {};
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Initialize last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = months[d.getMonth()];
      monthlyData[label] = 0;
    }

    orders.forEach(order => {
      const label = months[order.createdAt.getMonth()];
      if (monthlyData[label] !== undefined) {
        monthlyData[label] += Number(order.totalAmount);
      }
    });

    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .reverse(); // Standard chronological order for the last 6 months
  }

  async getInventoryValuationBySet(tenantId: string): Promise<InventoryValuation[]> {
    const items = await prisma.inventoryItem.findMany({
      where: {
        tenantId,
        active: true,
        quantity: { gt: 0 }
      },
      select: {
        price: true,
        quantity: true,
        cardTemplate: {
          select: {
            set: true
          }
        }
      }
    });

    const valuationMap: Record<string, { value: number; count: number }> = {};

    items.forEach(item => {
      const setName = item.cardTemplate.set;
      if (!valuationMap[setName]) {
        valuationMap[setName] = { value: 0, count: 0 };
      }
      valuationMap[setName].value += Number(item.price) * item.quantity;
      valuationMap[setName].count += item.quantity;
    });

    const results = Object.entries(valuationMap).map(([set, data]) => ({
      set,
      value: data.value,
      count: data.count
    }));

    return results.sort((a, b) => b.value - a.value).slice(0, 10);
  }
}


