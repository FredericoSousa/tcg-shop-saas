import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdminApi } from "@/lib/tenant-server";
import { logger } from "@/lib/logger";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";

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
 *     description: Processes a checkout from the POS system. Requires admin authentication.
 *     tags: [POS]
 *     security:
 *       - cookieAuth: []
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
 *       200:
 *         description: Success
 *       400:
 *         description: Empty cart
 */
import { Factory } from "@/lib/infrastructure/factory";
import { posCheckoutSchema } from "@/lib/infrastructure/validation/pos.schema";


export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const body = await request.json();
      const { items, customerData } = posCheckoutSchema.parse(body);

      const posCheckoutUseCase = Factory.getPOSCheckoutUseCase();
      const { orderId, friendlyId } = await posCheckoutUseCase.execute({
        items,
        customerData: {
          id: customerData.id,
          name: customerData.name,
          phoneNumber: customerData.phoneNumber
        },
      });



      // Revalidar rotas críticas
      revalidatePath("/admin/orders");
      revalidatePath("/admin/products");

      return ApiResponse.success({ orderId, friendlyId });
    } catch (error: unknown) {
      logger.error("POS Checkout Error", error as Error, { tenantId: tenant.id });
      return ApiResponse.fromError(error);
    }
  });
}
