"use client";

import { OrderStatusManager } from "@/components/admin/order-status-manager";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export type OrderItemType = {
  id: string;
  quantity: number;
  priceAtPurchase: number;
  inventoryItem?: {
    condition: string;
    language: string;
    cardTemplate: {
      name: string;
      set: string;
      imageUrl: string | null;
    } | null;
  } | null;
  product?: {
    name: string;
    imageUrl: string | null;
    category: { name: string } | null;
  } | null;
};

export type OrderType = {
  id: string;
  customer: {
    name: string;
    phoneNumber: string;
  };
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date | string;
  items: OrderItemType[];
};

export function OrdersClient({ orders }: { orders: OrderType[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-dashed text-muted-foreground shadow-sm">
        <h3 className="text-xl font-bold mb-2">Sem vendas consolidadas</h3>
        <p>
          A loja ainda não possui registros transacionais no banco de dados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div
          key={order.id}
          className="bg-card border hover:border-muted transition-colors rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border-b">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="font-extrabold text-lg tracking-tight">
                  {order.customer.name}
                </h3>
              </div>
              <div className="text-sm text-muted-foreground font-medium flex flex-wrap items-center gap-2">
                <span>{order.customer.phoneNumber}</span>
                <span className="opacity-50">•</span>
                <span>{new Date(order.createdAt).toLocaleString("pt-BR")}</span>
                <span className="opacity-50">•</span>
                <span className="font-mono text-xs bg-muted/50 text-muted-foreground font-bold px-2 py-0.5 rounded border">
                  #{order.id.slice(-8).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 md:justify-end">
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-0.5">
                  Total
                </p>
                <p className="font-black text-2xl text-primary leading-none">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(order.totalAmount)}
                </p>
              </div>

              <OrderStatusManager
                orderId={order.id}
                currentStatus={order.status}
                variant="select"
              />
            </div>
          </div>

          <div className="p-3 bg-card border-t border-muted/50 flex justify-end">
            <Link
              href={`/admin/orders/${order.id}`}
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg flex items-center gap-2"
            >
              Ver Detalhes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
