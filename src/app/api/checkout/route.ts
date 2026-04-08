import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { getTenant } from "@/lib/tenant-server";
import { PrismaOrderRepository } from "@/lib/infrastructure/repositories/prisma-order.repository";
import { PrismaInventoryRepository } from "@/lib/infrastructure/repositories/prisma-inventory.repository";
import { PrismaCustomerRepository } from "@/lib/infrastructure/repositories/prisma-customer.repository";
import { PlaceOrderUseCase } from "@/lib/application/use-cases/place-order.use-case";
import { logger } from "@/lib/logger";

const orderRepo = new PrismaOrderRepository();
const inventoryRepo = new PrismaInventoryRepository();
const customerRepo = new PrismaCustomerRepository();
const placeOrderUseCase = new PlaceOrderUseCase(orderRepo, inventoryRepo, customerRepo);

export type CheckoutItem = {
  inventoryId: string;
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
    return Response.json(
      { success: false, error: "Tenant ID não identificado" },
      { status: 401 },
    );
  }

  try {
    const { items, customerData } = (await request.json()) as {
      items: CheckoutItem[];
      customerData: CustomerData;
    };

    if (!items || items.length === 0) {
      return Response.json(
        { success: false, error: "O carrinho está vazio" },
        { status: 400 },
      );
    }

    const { orderId } = await placeOrderUseCase.execute({
      items,
      customerData,
    });

    // Revalidar rotas críticas de estoque e pedidos
    revalidatePath("/");
    revalidatePath("/singles");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");

    return Response.json({ success: true, orderId });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Checkout Error", err, { tenantId: tenant.id });
    
    return Response.json(
      {
        success: false,
        error: err.message || "Erro catastrófico no processamento do checkout.",
      },
      { status: 500 },
    );
  }
}
