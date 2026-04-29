import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getTenant } from "@/lib/tenant-server";
import { runWithTenant } from "@/lib/tenant-context";
import { container } from "@/lib/infrastructure/container";
import { PlaceOrderUseCase } from "@/lib/application/use-cases/orders/place-order.use-case";
import { ApiResponse } from "@/lib/infrastructure/http/api-response";
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

  try {
    const { items, customerData } = (await request.json()) as {
      items: CheckoutItem[];
      customerData: CustomerData;
    };

    if (!items || items.length === 0) {
      return ApiResponse.badRequest("O carrinho está vazio");
    }

    const { orderId } = await runWithTenant(tenant.id, () =>
      placeOrderUseCase.execute({
        items,
        customerData,
      })
    );

    revalidatePath("/");
    revalidatePath("/singles");
    revalidatePath("/products");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");

    return ApiResponse.success({ orderId });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Checkout Error", err, { tenantId: tenant.id });

    return ApiResponse.serverError(err.message || "Erro catastrófico no processamento do checkout.");
  }
}
