"use client";

import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Eye, Printer, Package } from "lucide-react";
import { cn, formatPhone, formatCurrency } from "@/lib/utils";
import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CustomerSelector,
  CustomerType,
} from "@/components/admin/pos/customer-selector";
import { useTableState } from "@/lib/hooks/use-table-state";
import { FilterSection } from "@/components/admin/filter-section";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { TableSearch } from "@/components/admin/table-search";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  friendlyId?: string | null;
  items: OrderItemType[];
};

const OrderTableView = ({
  items,
  selectedIds,
  onSelect,
  onSelectAll,
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
          <TableHead className="font-bold w-[110px]">Itens</TableHead>
          <TableHead className="font-bold">Cliente</TableHead>
          <TableHead className="font-bold text-center">Origem</TableHead>
          <TableHead className="font-bold text-right">Qtd</TableHead>
          <TableHead className="font-bold text-right">Total</TableHead>
          <TableHead className="font-bold">Status</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={9}
              className="h-24 text-center text-muted-foreground"
            >
              Nenhum pedido encontrado.
            </TableCell>
          </TableRow>
        ) : (
          items.map((order) => {
            const thumbs = order.items
              .slice(0, 3)
              .map(
                (it) =>
                  it.inventoryItem?.cardTemplate?.imageUrl ||
                  it.product?.imageUrl ||
                  null,
              );
            const extraCount = Math.max(0, order.items.length - 3);
            return (
              <TableRow
                key={order.id}
                className={selectedIds.includes(order.id) ? "bg-primary/5" : ""}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(order.id)}
                    onChange={() => onSelect(order.id)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="flex flex-col group"
                  >
                    <span className="font-mono text-2xs font-bold text-muted-foreground group-hover:text-primary transition-colors">
                      {order.friendlyId
                        ? `#${order.friendlyId}`
                        : `#${order.id.slice(-8).toUpperCase()}`}
                    </span>
                    <span className="text-xs font-medium">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {thumbs.map((url, idx) => (
                      <div
                        key={idx}
                        className="h-10 w-7 rounded-md border-2 border-background bg-muted shadow-sm overflow-hidden shrink-0 ring-1 ring-border/30 flex items-center justify-center"
                      >
                        {url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </div>
                    ))}
                    {extraCount > 0 && (
                      <div className="h-10 w-7 rounded-md border-2 border-background bg-muted shadow-sm flex items-center justify-center text-2xs font-bold text-muted-foreground shrink-0 ring-1 ring-border/30">
                        +{extraCount}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm tracking-tight">
                      {order.customer.name}
                    </span>
                    <span className="text-2xs text-muted-foreground">
                      {formatPhone(order.customer.phoneNumber)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={`text-2xs font-black uppercase tracking-tighter ${
                      order.source === "POS"
                        ? "bg-info-muted text-info"
                        : "bg-success-muted text-success"
                    }`}
                  >
                    {order.source === "POS" ? "PDV" : "E-COM"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-bold text-sm">
                  {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                </TableCell>
                <TableCell className="text-right font-black text-primary">
                  {formatCurrency(order.totalAmount)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-bold uppercase tracking-wider text-2xs",
                      order.status === "PENDING" &&
                        "bg-warning-muted text-warning border-warning/20",
                      order.status === "PAID" &&
                        "bg-success-muted text-success border-success/20",
                      order.status === "SHIPPED" &&
                        "bg-info-muted text-info border-info/20",
                      order.status === "CANCELLED" &&
                        "bg-destructive-muted text-destructive border-destructive/20",
                    )}
                  >
                    {order.status === "PENDING"
                      ? "Pendente"
                      : order.status === "PAID"
                        ? "Pago"
                        : order.status === "SHIPPED"
                          ? "Enviado"
                          : "Cancelado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          className="h-8 w-8 rounded-md flex items-center justify-center hover:bg-muted transition-colors"
                          aria-label="Ações do pedido"
                        />
                      }
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        render={<Link href={`/admin/orders/${order.id}`} />}
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver detalhes</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        render={
                          <Link href={`/admin/orders/${order.id}?print=1`} />
                        }
                      >
                        <Printer className="h-4 w-4" />
                        <span>Imprimir recibo</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  </div>
);

export function OrdersClient({
  initialOrders,
  total,
  pageCount,
}: {
  initialOrders: OrderType[];
  total: number;
  pageCount: number;
}) {
  const router = useRouter();

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

  const [selectedCustomer, setSelectedCustomer] =
    React.useState<CustomerType | null>(null);
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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === initialOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(initialOrders.map((o) => o.id));
    }
  };

  const clearSelection = () => setSelectedIds([]);

  return (
    <div className="space-y-6">
      <FilterSection resultsCount={total}>
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código ou cliente..."
          isLoading={isPending}
        />

        <Select
          value={currentSource || "all"}
          onValueChange={(val) =>
            setFilter("source", val === "all" ? null : val)
          }
        >
          <SelectTrigger className="w-full sm:w-[150px] font-bold">
            <SelectValue placeholder="Origem">
              {currentSource === "ECOMMERCE"
                ? "E-commerce"
                : currentSource === "POS"
                  ? "PDV (Comandas)"
                  : "Todas as Origens"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Origens</SelectItem>
            <SelectItem value="ECOMMERCE">E-commerce</SelectItem>
            <SelectItem value="POS">PDV (Comandas)</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={currentStatus || "all"}
          onValueChange={(val) =>
            setFilter("status", val === "all" ? null : val)
          }
        >
          <SelectTrigger className="w-full sm:w-[150px] font-bold">
            <SelectValue placeholder="Status">
              {currentStatus === "all" || !currentStatus
                ? "Todos Status"
                : currentStatus}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {Object.values(OrderStatus).map((status) => (
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
      </FilterSection>

      <div
        className={
          isPending
            ? "opacity-50 pointer-events-none transition-opacity"
            : "transition-opacity"
        }
      >
        <OrderTableView
          items={initialOrders}
          selectedIds={selectedIds}
          onSelect={handleSelectOrder}
          onSelectAll={handleSelectAll}
        />
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
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
