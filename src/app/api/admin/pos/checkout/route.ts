import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdminApi } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { POSCheckoutUseCase } from "@/lib/application/use-cases/pos-checkout.use-case";
import { logger } from "@/lib/logger";

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

export async function POST(request: NextRequest) {
  return withAdminApi(async ({ tenant }) => {
    try {
      const { items, customerData } = (await request.json()) as {
        items: POSCheckoutItem[];
        customerData: POSCustomerData;
      };

      if (!items || items.length === 0) {
        return Response.json(
          { success: false, error: "O carrinho está vazio" },
          { status: 400 },
        );
      }

      const posCheckoutUseCase = container.resolve(POSCheckoutUseCase);
      const { orderId } = await posCheckoutUseCase.execute({
        items,
        customerData,
      });

      // Revalidar rotas críticas
      revalidatePath("/admin/orders");
      revalidatePath("/admin/products");

      return Response.json({ success: true, orderId });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error("POS Checkout Error", err, { tenantId: tenant.id });
      
      return Response.json(
        {
          success: false,
          error: err.message || "Erro no processamento do PDV.",
        },
        { status: 500 },
      );
    }
  });
}
