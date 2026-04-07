import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/admin/page-header";
import { ShoppingCart } from "lucide-react";
import { OrdersClient } from "./orders-client";

export default async function OrdersPage() {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");

  if (!tenantId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Falha de Autorização
        </h1>
        <p className="text-muted-foreground">
          Esta página requer identificação de Lojista vinculada ao subdomínio ou
          sessão ativa.
        </p>
      </div>
    );
  }

  const orders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: {
        include: {
          inventoryItem: {
            include: {
              cardTemplate: true,
            },
          },
        },
      },
    },
  });

  // Format Decimal fields strictly for JSON Client Boundary transmission
  const formattedOrders = orders.map((order) => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    customer: {
      name: order.customer.name,
      phoneNumber: order.customer.phoneNumber,
    },
    items: order.items.map((item) => ({
      ...item,
      priceAtPurchase: Number(item.priceAtPurchase),
      inventoryItem: {
        ...item.inventoryItem,
        price: Number(item.inventoryItem.price),
      },
    })),
  }));

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Registro de Vendas"
        description="Acompanhe e gerencie as compras realizadas na sua loja"
        icon={ShoppingCart}
      />

      <div className="bg-card rounded-lg shadow-sm border p-3 md:p-4">
        <OrdersClient orders={formattedOrders} />
      </div>
    </div>
  );
}
