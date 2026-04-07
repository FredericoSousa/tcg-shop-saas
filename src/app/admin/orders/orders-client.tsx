"use client";

import { OrderStatusManager } from "@/components/admin/order-status-manager";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, FilterIcon } from "lucide-react";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSelector, CustomerType } from "@/components/admin/pos/customer-selector";
import { useTableState } from "@/lib/hooks/use-table-state";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { TableSearch } from "@/components/admin/table-search";

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

export function OrdersClient({ 
  initialOrders, 
  total, 
  pageCount 
}: { 
  initialOrders: OrderType[];
  total: number;
  pageCount: number;
}) {
  const {
    page,
    limit,
    search,
    getFilter,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    isPending,
  } = useTableState({ defaultLimit: 8 });

  const currentSource = getFilter("source");
  const currentStatus = getFilter("status");
  const customerPhone = getFilter("customerPhone");

  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerType | null>(null);

  // Sync selectedCustomer state if customerPhone is in URL
  React.useEffect(() => {
    if (!customerPhone) {
      setSelectedCustomer(null);
    }
  }, [customerPhone]);

  const handleCustomerSelect = (customer: CustomerType | null) => {
    setSelectedCustomer(customer);
    setFilter("customerPhone", customer?.phoneNumber || null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm overflow-visible">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FilterIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-muted-foreground whitespace-nowrap hidden sm:inline">Filtrar:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 overflow-visible">
          <TableSearch 
            value={search} 
            onChange={setSearch} 
            placeholder="Buscar por ID ou cliente..."
            isLoading={isPending}
          />

          <Select value={currentSource || "all"} onValueChange={(val) => setFilter("source", val === "all" ? null : val)}>
            <SelectTrigger className="w-full sm:w-[150px] font-bold">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Origens</SelectItem>
              <SelectItem value="ecommerce">E-commerce</SelectItem>
              <SelectItem value="pos">PDV (Comandas)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={currentStatus || "all"} onValueChange={(val) => setFilter("status", val === "all" ? null : val)}>
            <SelectTrigger className="w-full sm:w-[150px] font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.values(OrderStatus).map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex-1 w-full overflow-visible">
            <CustomerSelector 
              selectedCustomer={selectedCustomer} 
              onSelect={handleCustomerSelect} 
              hideLabel 
              size="sm" 
            />
          </div>
        </div>

        <div className="text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-1.5 rounded-full border self-start lg:self-center">
          <span className="font-bold text-primary">{total}</span> resultados
        </div>
      </div>

      <div className={isPending ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
        <OrderList items={initialOrders} />
      </div>

      <DataTablePagination 
        page={page}
        pageCount={pageCount}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  );
}
