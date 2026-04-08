import { PageHeader } from "@/components/admin/page-header";
import { ShoppingCart } from "lucide-react";
import { OrdersClient, OrderType } from "./orders-client";
import { OrderStatus } from "@prisma/client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    source?: string;
    status?: string;
    customerPhone?: string;
  }>;
}) {
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 8;
  const search = params.search;
  const source = params.source as "POS" | "ECOMMERCE" | "all";
  const status = params.status as OrderStatus | "all";
  const customerPhone = params.customerPhone;

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search ? { search } : {}),
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
    ...(customerPhone ? { customerPhone } : {}),
  });

  // Call the internal API to fulfill "move all database operations to the api"
  const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/orders?${queryParams}`;
  
  const response = await fetch(apiUrl, {
    headers: await (await import("next/headers")).headers(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch orders from API");
  }

  const { items, total, pageCount } = await response.json();

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Vendas"
        description="Acompanhe e gerencie as compras realizadas na sua loja"
        icon={ShoppingCart}
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden p-0">
        <OrdersClient
          initialOrders={items as unknown as OrderType[]}
          total={total}
          pageCount={pageCount}
        />
      </div>
    </div>
  );
}
