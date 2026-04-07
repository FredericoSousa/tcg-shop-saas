import { headers } from "next/headers";
import { PageHeader } from "@/components/admin/page-header";
import { ShoppingCart } from "lucide-react";
import { OrdersClient } from "./orders-client";
import { getOrdersPaginated } from "@/lib/services/order.service";
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
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const params = await searchParams;

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

  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 8;
  const search = params.search;
  const source = params.source as "POS" | "ECOMMERCE" | "all";
  const status = params.status as OrderStatus | "all";
  const customerPhone = params.customerPhone;

  const { items, total, pageCount } = await getOrdersPaginated(
    tenantId,
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
          initialOrders={items as any}
          total={total}
          pageCount={pageCount}
        />
      </div>
    </div>
  );
}
