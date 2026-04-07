import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SetBadge } from "@/components/ui/set-badge";
import { OrderStatusManager } from "@/components/admin/order-status-manager";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, tenantId },
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
    <div className="flex flex-col gap-4 w-full">
      <Link
        href="/admin/orders"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Pedidos
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-5 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary mb-1">
            Pedido #{order.id.slice(-8).toUpperCase()}
          </h1>
          <div className="text-sm text-muted-foreground font-medium flex flex-wrap items-center gap-2">
            <span>{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
            <span className="opacity-50">•</span>
            <span className="font-bold text-foreground">{order.customer.name}</span>
            <span className="opacity-50">•</span>
            <span>{order.customer.phoneNumber}</span>
            <span className="opacity-50">•</span>
            <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
              order.source === "POS" 
                ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
            }`}>
              {order.source === "POS" ? "PDV" : "E-commerce"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <OrderStatusManager
            orderId={order.id}
            currentStatus={order.status}
            variant="select"
          />
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">
              Total
            </p>
            <p className="font-black text-2xl text-primary leading-none">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(Number(order.totalAmount))}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-sm border p-4">
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
                        iconClassName="h-4 w-4 dark:invert"
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
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(Number(item.priceAtPurchase))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
