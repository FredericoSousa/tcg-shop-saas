import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { POSCheckoutUseCase } from "@/lib/application/use-cases/pos-checkout.use-case";
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
export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { items, customerData } = (await request.json()) as {
        items: POSCheckoutItem[];
        customerData: POSCustomerData;
      };

      if (!items || items.length === 0) {
        return ApiResponse.badRequest("O carrinho está vazio");
      }

      const posCheckoutUseCase = container.resolve(POSCheckoutUseCase);
      const { orderId, friendlyId } = await posCheckoutUseCase.execute({
        items,
        customerData,
      });

      // Revalidar rotas críticas
      revalidatePath("/admin/orders");
      revalidatePath("/admin/products");

      return ApiResponse.success({ orderId, friendlyId });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error("POS Checkout Error", err, { tenantId: tenant.id });
      
      return ApiResponse.serverError(err.message || "Erro no processamento do PDV.");
    }
  });
}
