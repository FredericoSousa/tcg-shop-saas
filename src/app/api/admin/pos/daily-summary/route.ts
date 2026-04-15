import { withAdminApi } from "@/lib/tenant-server";
import { Factory } from "@/lib/infrastructure/factory";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

export async function GET() {
  return withAdminApi(async ({ tenant }) => {
    try {
      const reportsRepo = Factory.getReportsRepository();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sales = await reportsRepo.getSalesBySource(tenant.id, today, new Date());
      const posSales = sales.find(s => s.source === "POS") || { count: 0, revenue: 0 };

      return ApiResponse.success({
        orderCount: posSales.count,
        revenue: posSales.revenue,
      });
    } catch (error) {
      return ApiResponse.fromError(error);
    }
  });
}
