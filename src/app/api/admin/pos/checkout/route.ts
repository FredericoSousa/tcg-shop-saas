import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { validateAdminApi } from "@/lib/tenant-server";

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
  const context = await validateAdminApi();

  if (!context) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { tenant } = context;

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

    // Iniciar uma prisma.$transaction
    const order = await prisma.$transaction(async (tx) => {
      // Validar existência dos produtos e tenant
      for (const item of items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            tenantId: tenant.id,
            active: true,
            deletedAt: null,
          }
        });

        if (!product) {
          throw new Error(`Produto não encontrado ou inativo: ${item.productId}`);
        }

        // Decrementar estoque do produto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      const totalAmount = items.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0,
      );

      // Get Customer
      let customerId: string;
      if (customerData.id) {
        customerId = customerData.id;
      } else if (customerData.phoneNumber) {
        const customer = await tx.customer.upsert({
          where: {
            phoneNumber_tenantId: {
              phoneNumber: customerData.phoneNumber,
              tenantId: tenant.id,
            },
          },
          update: {
            name: customerData.name || undefined,
          },
          create: {
            name: customerData.name || "Consumidor Final",
            phoneNumber: customerData.phoneNumber,
            tenantId: tenant.id,
          },
        });
        customerId = customer.id;
      } else {
        throw new Error("Cliente ou Telefone é obrigatório.");
      }

      // Check for existing PENDING order for this customer and tenant from POS
      const existingOrder = await tx.order.findFirst({
        where: {
          tenantId: tenant.id,
          customerId,
          status: "PENDING",
          source: "POS",
        },
        include: {
          items: true,
        }
      });
      if (existingOrder) {
        // Appending to existing order
        await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            totalAmount: {
              increment: totalAmount,
            },
          },
        });

        // Update items: increment quantity if exists, otherwise create
        for (const item of items) {
          const existingItem = existingOrder.items.find(
            (oi) => oi.productId === item.productId
          );

          if (existingItem) {
            await tx.orderItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: { increment: item.quantity },
              },
            });
          } else {
            await tx.orderItem.create({
              data: {
                orderId: existingOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.price,
              },
            });
          }
        }
        return existingOrder;
      } else {
        // Creating a new order
        const newOrder = await tx.order.create({
          data: {
            tenantId: tenant.id,
            customerId,
            totalAmount,
            status: "PENDING",
            source: "POS",
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.price,
              })),
            },
          },
        });

        return newOrder;
      }
    });

    // Revalidar rotas críticas
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");

    return Response.json({ success: true, orderId: order.id });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[POS Checkout Error]", err.message);
    return Response.json(
      {
        success: false,
        error: err.message || "Erro no processamento do PDV.",
      },
      { status: 500 },
    );
  }
}
