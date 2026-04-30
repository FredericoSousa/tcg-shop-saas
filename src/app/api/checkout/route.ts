import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getTenant } from "@/lib/tenant-server";
import { runWithTenant } from "@/lib/tenant-context";
import { container } from "@/lib/infrastructure/container";
import { PlaceOrderUseCase } from "@/lib/application/use-cases/orders/place-order.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import {
  getIdempotencyKey,
  withIdempotency,
} from "@/lib/infrastructure/http/idempotency";
import { cacheTags } from "@/lib/cache-tags";
import { logger } from "@/lib/logger";

const placeOrderUseCase = container.resolve(PlaceOrderUseCase);

export type CheckoutItem = {
  inventoryId?: string;
  productId?: string;
  quantity: number;
  price: number;
};

export type CustomerData = {
  name?: string;
  email?: string;
  phoneNumber: string;
};

export async function POST(request: NextRequest) {
  const tenant = await getTenant();

  if (!tenant) {
    return ApiResponse.unauthorized("Tenant ID não identificado");
  }

  const idempotencyKey = getIdempotencyKey(request);
  const scope = `checkout:${tenant.id}`;

  const handler = async () => {
    try {
      const { items, customerData } = (await request.json()) as {
        items: CheckoutItem[];
        customerData: CustomerData;
      };

      if (!items || items.length === 0) {
        return { status: 400, body: { success: false, message: "O carrinho está vazio" } };
      }

      const { orderId } = await runWithTenant(tenant.id, () =>
        placeOrderUseCase.execute({ items, customerData }),
      );

      // Next 16 requires a profile; "max" gives stale-while-revalidate
      // semantics, so storefront listings refresh in the background.
      revalidateTag(cacheTags.inventory(tenant.id), "max");
      revalidateTag(cacheTags.products(tenant.id), "max");
      revalidateTag(cacheTags.orders(tenant.id), "max");

      return { status: 200, body: { success: true, data: { orderId } } };
    } catch (error: unknown) {
      const err = error as Error;
      logger.error("Checkout Error", err, { tenantId: tenant.id });
      const response = ApiResponse.fromError(error);
      return { status: response.status, body: await response.json() };
    }
  };

  if (!idempotencyKey) {
    const result = await handler();
    return NextResponse.json(result.body, { status: result.status });
  }

  const { status, body } = await withIdempotency(scope, idempotencyKey, handler);
  return NextResponse.json(body, { status });
}
