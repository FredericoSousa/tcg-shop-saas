import { NextRequest, connection } from "next/server";
import { container } from "@/lib/infrastructure/container";
import { TOKENS } from "@/lib/infrastructure/container";
import type { IOrderRepository } from "@/lib/domain/repositories/order.repository";
import { posInProgressOrderSchema } from "@/lib/infrastructure/validation/pos.schema";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import { withAdminApi } from "@/lib/tenant-server";

export async function GET(request: NextRequest) {
  return withAdminApi(async () => {
    await connection();

    const searchParams = request.nextUrl.searchParams;
    const { customerId } = posInProgressOrderSchema.parse({
      customerId: searchParams.get("customerId"),
    });

    const orderRepo = container.resolve<IOrderRepository>(TOKENS.OrderRepository);
    const order = await orderRepo.findPendingPOSOrder(customerId);

    if (!order) {
      return ApiResponse.success(null);
    }

    const formattedItems =
      order.items?.map((item) => {
        const product = (item as { product?: { name: string; imageUrl: string | null } }).product;
        return {
          id: item.id,
          name: product?.name || "Produto",
          imageUrl: product?.imageUrl,
          price: Number(item.priceAtPurchase),
          quantity: item.quantity,
        };
      }) || [];

    return ApiResponse.success({
      id: order.id,
      friendlyId: order.friendlyId,
      totalAmount: order.totalAmount,
      items: formattedItems,
    });
  });
}
