import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { SetBadge } from "@/components/ui/set-badge";
import { OrderStatusManager } from "@/components/admin/order-status-manager";
import { getAdminContext } from "@/lib/tenant-server";
import { OrderActions } from "./order-actions";
import { formatCurrency } from "@/lib/utils";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenant } = await getAdminContext();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, tenantId: tenant.id },
    include: {
      customer: true,
      items: {
        include: {
          inventoryItem: {
            include: {
              cardTemplate: true,
            },
          },
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground w-fit transition-colors px-1"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Pedidos
      </Link>

      <PageHeader
        title={`Pedido #${order.friendlyId || order.id.slice(-8).toUpperCase()}`}
        description={`${new Date(order.createdAt).toLocaleString("pt-BR")} • ${order.customer.name}`}
        icon={ShoppingCart}
        actions={
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-background/50 p-3 rounded-lg border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className={`text-[10px] uppercase font-black px-2 py-1 rounded-md border ${
                order.source === "POS" 
                  ? "bg-blue-100 text-blue-700 border-blue-200"
                  : "bg-emerald-100 text-emerald-700 border-emerald-200"
              }`}>
                {order.source === "POS" ? "PDV" : "E-commerce"}
              </span>
              <OrderStatusManager
                orderId={order.id}
                currentStatus={order.status}
                variant="select"
              />
              <OrderActions 
                orderId={order.id} 
                customerId={order.customerId}
                totalAmount={Number(order.totalAmount)} 
                status={order.status} 
                friendlyId={order.friendlyId}
              />
            </div>
            <div className="h-8 w-px bg-border/50 hidden sm:block mx-1" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mb-1">Total</span>
              <span className="font-black text-xl text-primary leading-none">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        }
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden p-6">
        <h2 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Itens da Compra (
          {order.items.reduce((acc, item) => acc + item.quantity, 0)})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors"
            >
              <div className="h-20 w-14 shrink-0 bg-card rounded-lg shadow-sm border overflow-hidden">
                {(item.inventoryItem?.cardTemplate?.imageUrl || item.product?.imageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(item.inventoryItem?.cardTemplate?.imageUrl || item.product?.imageUrl) as string}
                    className="h-full w-full object-cover"
                    alt={item.inventoryItem?.cardTemplate?.name || item.product?.name || "Produto"}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate leading-tight mb-1">
                  {item.inventoryItem?.cardTemplate?.name || item.product?.name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {item.inventoryItem ? (
                    <>
                      <SetBadge
                        setCode={item.inventoryItem.cardTemplate?.set || ""}
                        iconClassName="h-4 w-4"
                        textClassName="text-xs m-0 leading-none text-foreground"
                      />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                        <span className="text-muted-foreground/30">•</span>{" "}
                        {item.inventoryItem.condition}{" "}
                        <span className="text-muted-foreground/30">•</span>{" "}
                        {item.inventoryItem.language}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                      {item.product?.category?.name || "Sem Categoria"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 min-w-20">
                <p className="text-lg font-black">{item.quantity}x</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {formatCurrency(item.priceAtPurchase)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
