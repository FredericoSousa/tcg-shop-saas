"use client";

import { OrderStatusManager } from "@/components/admin/order-status-manager";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, FilterIcon, ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CustomerSelector } from "@/components/admin/pos/customer-selector";

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
  source: "POS" | "ECOMMERCE";
  createdAt: Date | string;
  items: OrderItemType[];
};

const OrderList = ({ items }: { items: OrderType[] }) => (
  <div className="space-y-6">
    {items.length === 0 ? (
      <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed text-muted-foreground">
        <p>Nenhum pedido encontrado com os filtros atuais.</p>
      </div>
    ) : (
      items.map((order) => (
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
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${order.source === "POS"
                    ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                    : "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                  }`}>
                  {order.source === "POS" ? "PDV" : "E-commerce"}
                </span>
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
      ))
    )}
  </div>
);

export function OrdersClient({ orders }: { orders: OrderType[] }) {
  const [filter, setFilter] = React.useState("all");
  const [selectedCustomer, setSelectedCustomer] = React.useState<any | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const ecommerceOrdersList = React.useMemo(() => orders.filter((o) => o.source === "ECOMMERCE"), [orders]);
  const posOrdersList = React.useMemo(() => orders.filter((o) => o.source === "POS"), [orders]);

  const filteredOrders = React.useMemo(() => {
    let result = orders;
    if (filter === "ecommerce") result = ecommerceOrdersList;
    if (filter === "pos") result = posOrdersList;

    if (selectedCustomer) {
      // Filter by phone number as it's the unique identifier used across the platform
      result = result.filter(o => o.customer.phoneNumber === selectedCustomer.phoneNumber);
    }
    return result;
  }, [filter, selectedCustomer, ecommerceOrdersList, posOrdersList, orders]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = React.useMemo(() => 
    filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredOrders, currentPage, itemsPerPage]
  );

  // Reset page when filter/customer changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, selectedCustomer]);

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-xl border border-dashed text-muted-foreground shadow-sm">
        <h3 className="text-xl font-bold mb-2">Sem vendas consolidadas</h3>
        <p>A loja ainda não possui registros transacionais no banco de dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm overflow-visible">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FilterIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-muted-foreground whitespace-nowrap hidden sm:inline">Filtrar:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 flex-1 overflow-visible">
          <Select value={filter} onValueChange={(val) => setFilter(val ?? "all")}>
            <SelectTrigger className="w-full sm:w-[150px] font-bold">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="pos">PDV (Comandas)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1 overflow-visible">
            <CustomerSelector 
              selectedCustomer={selectedCustomer} 
              onSelect={setSelectedCustomer} 
              hideLabel 
              size="sm" 
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-1.5 rounded-full border self-start lg:self-center">
          <span className="font-bold text-primary">{filteredOrders.length}</span> resultados
        </div>
      </div>

      <OrderList items={paginatedOrders} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-muted/50 pt-6">
          <div className="text-sm text-muted-foreground font-medium">
            Mostrando <span className="font-bold text-foreground">{Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredOrders.length, currentPage * itemsPerPage)}</span> de <span className="font-bold text-foreground">{filteredOrders.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="h-8 font-bold gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-1">
               {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, i, arr) => {
                  const showEllipsis = i > 0 && page - arr[i - 1] > 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
                      <Button
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 font-bold ${currentPage === page ? "shadow-md scale-105" : ""}`}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                })}
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="h-8 font-bold gap-1"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
