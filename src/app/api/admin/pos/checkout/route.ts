import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: "Tenant ID não identificado" },
      { status: 401 },
    );
  }

  try {
    const { items, customerData } = (await request.json()) as {
      items: POSCheckoutItem[];
      customerData: POSCustomerData;
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
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
            tenantId,
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
              tenantId,
            },
          },
          update: {
            name: customerData.name || undefined,
          },
          create: {
            name: customerData.name || "Consumidor Final",
            phoneNumber: customerData.phoneNumber,
            tenantId,
          },
        });
        customerId = customer.id;
      } else {
        throw new Error("Cliente ou Telefone é obrigatório.");
      }

      // Check for existing PENDING order for this customer and tenant
      const existingOrder = await tx.order.findFirst({
        where: {
          tenantId,
          customerId,
          status: "PENDING",
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
            tenantId,
            customerId,
            totalAmount,
            status: "PENDING",
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

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[POS Checkout Error]", err.message);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Erro no processamento do PDV.",
      },
      { status: 500 },
    );
  }
}
