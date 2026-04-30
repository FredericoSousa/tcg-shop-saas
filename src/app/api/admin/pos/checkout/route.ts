import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { withAdminApi } from "@/lib/tenant-server";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
import {
  getIdempotencyKey,
  withIdempotency,
} from "@/lib/infrastructure/http/idempotency";
import { Factory } from "@/lib/infrastructure/factory";
import { posCheckoutSchema } from "@/lib/infrastructure/validation/pos.schema";
import { cacheTags } from "@/lib/cache-tags";

export type POSCheckoutItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type POSCustomerData = {
  id?: string;
  name?: string;
  phoneNumber?: string;
};

/**
 * @openapi
 * /api/admin/pos/checkout:
 *   post:
 *     summary: Process POS checkout
 *     description: Processes a checkout from the POS system. Requires admin authentication. Honors `Idempotency-Key` header.
 *     tags: [POS]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema: { type: string }
 *         required: false
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [items, customerData]
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [productId, quantity, price]
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: number }
 *                     price: { type: number }
 *               customerData:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   name: { type: string }
 *                   phoneNumber: { type: string }
 *     responses:
 *       200: { description: Success }
 *       400: { description: Empty cart }
 *       409: { description: In-flight retry with same Idempotency-Key }
 */
export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    const idempotencyKey = getIdempotencyKey(request);
    const scope = `pos-checkout:${tenant.id}`;

    const handler = async () => {
      try {
        const body = await request.json();
        const { items, customerData } = posCheckoutSchema.parse(body);

        const posCheckoutUseCase = Factory.getPOSCheckoutUseCase();
        const { orderId, friendlyId } = await posCheckoutUseCase.execute({
          items,
          customerData: {
            id: customerData.id,
            name: customerData.name,
            phoneNumber: customerData.phoneNumber,
          },
        });

        revalidateTag(cacheTags.orders(tenant.id), "max");
        revalidateTag(cacheTags.products(tenant.id), "max");

        return { status: 200, body: { success: true, data: { orderId, friendlyId } } };
      } catch (error: unknown) {
        logger.error("POS Checkout Error", error as Error, { tenantId: tenant.id });
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
  });
}
