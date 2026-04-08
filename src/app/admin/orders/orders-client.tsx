"use client";

import { OrderStatusManager } from "@/components/admin/order-status-manager";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowRight, FilterIcon, Check } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { OrderBulkActionsBar } from "@/components/admin/orders/order-bulk-actions-bar";
import { Badge } from "@/components/ui/badge";

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



const OrderTableView = ({ 
  items, 
  selectedIds, 
  onSelect,
  onSelectAll 
}: { 
  items: OrderType[]; 
  selectedIds: string[]; 
  onSelect: (id: string) => void;
  onSelectAll: () => void;
}) => (
  <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
    <Table>
      <TableHeader className="bg-muted/30">
        <TableRow>
          <TableHead className="w-[50px]">
            <input
              type="checkbox"
              checked={items.length > 0 && selectedIds.length === items.length}
              onChange={onSelectAll}
              className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
            />
          </TableHead>
          <TableHead className="font-bold">ID / Data</TableHead>
          <TableHead className="font-bold">Cliente</TableHead>
          <TableHead className="font-bold text-center">Origem</TableHead>
          <TableHead className="font-bold text-right">Itens</TableHead>
          <TableHead className="font-bold text-right">Total</TableHead>
          <TableHead className="font-bold">Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
              Nenhum pedido encontrado.
            </TableCell>
          </TableRow>
        ) : (
          items.map((order) => (
            <TableRow key={order.id} className={selectedIds.includes(order.id) ? "bg-primary/5" : ""}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(order.id)}
                  onChange={() => onSelect(order.id)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-bold text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className="text-xs font-medium">{new Date(order.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight">{order.customer.name}</span>
                  <span className="text-[10px] text-muted-foreground">{order.customer.phoneNumber}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-tighter ${
                  order.source === "POS" ? "bg-blue-100/50 text-blue-700" : "bg-emerald-100/50 text-emerald-700"
                }`}>
                  {order.source === "POS" ? "PDV" : "E-COM"}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-bold text-sm">
                {order.items.reduce((acc, item) => acc + item.quantity, 0)}
              </TableCell>
              <TableCell className="text-right font-black text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(order.totalAmount)}
              </TableCell>
              <TableCell>
                <OrderStatusManager
                  orderId={order.id}
                  currentStatus={order.status}
                  variant="select"
                />
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/admin/orders/${order.id}`} className="hover:text-primary">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
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
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);


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

  const handleSelectOrder = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === initialOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialOrders.map(o => o.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm overflow-visible">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FilterIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">Filtrar:</span>
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
        <OrderTableView items={initialOrders} selectedIds={selectedIds} onSelect={handleSelectOrder} onSelectAll={handleSelectAll} />
      </div>


      <DataTablePagination 
        page={page}
        pageCount={pageCount}
        total={total}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />

      {selectedIds.length > 0 && (
        <OrderBulkActionsBar
          selectedCount={selectedIds.length}
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
          onActionComplete={() => {
            clearSelection();
            // The status update API revalidates path, 
            // but we might need a router refresh or just trust revalidation
            window.location.reload(); 
          }}
        />
      )}
    </div>
  );
}
