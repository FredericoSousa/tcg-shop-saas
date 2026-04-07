import { PageHeader } from "@/components/admin/page-header";
import { ShoppingCart } from "lucide-react";
import { OrdersClient, OrderType } from "./orders-client";
import { getOrdersPaginated } from "@/lib/services/order.service";
import { OrderStatus } from "@prisma/client";
import { getAdminContext } from "@/lib/tenant-server";

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
  const { tenant } = await getAdminContext();
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 8;
  const search = params.search;
  const source = params.source as "POS" | "ECOMMERCE" | "all";
  const status = params.status as OrderStatus | "all";
  const customerPhone = params.customerPhone;

  const { items, total, pageCount } = await getOrdersPaginated(
    tenant.id,
    page,
    limit,
    {
      search,
      source,
      status,
      customerPhone,
    }
  );

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
