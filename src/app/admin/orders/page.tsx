import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { ListOrdersUseCase } from "@/lib/application/use-cases/list-orders.use-case";
import { PageHeader } from "@/components/admin/page-header";
import { ShoppingCart } from "lucide-react";
import { OrdersClient, OrderType } from "./orders-client";
import { OrderStatus, OrderSource } from "@/lib/domain/entities/order";

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
  const source = (params.source?.toUpperCase() as "POS" | "ECOMMERCE" | "all") || "all";
  const status = (params.status?.toUpperCase() as OrderStatus | "all") || "all";
  const customerPhone = params.customerPhone;

  // Resolve use case from container
  const listOrders = container.resolve(ListOrdersUseCase);
  
  const { items, total, pageCount } = await listOrders.execute({
    page,
    limit,
    filters: {
      source: source === "all" ? undefined : source as OrderSource,
      status: status === "all" ? undefined : status as OrderStatus,
      search,
      customerPhone,
    }
  });

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
