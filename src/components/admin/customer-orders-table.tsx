"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Order {
  id: string;
  totalAmount: string;
  status: string;
  createdAt: string;
  friendlyId?: string | null;
}

interface CustomerOrdersTableProps {
  customerId: string;
}

export function CustomerOrdersTable({ customerId }: CustomerOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers/${customerId}/orders?page=${page}&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch orders");
      const result = await response.json();
      if (result.success && result.data) {
        setOrders(result.data.items || []);
        setTotalPages(result.data.pageCount || 1);
      } else {
        throw new Error(result.message || "Failed to parse orders");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar histórico de pedidos");
    } finally {
      setLoading(false);
    }
  }, [customerId, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-zinc-200/50 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300 hover:shadow-lg">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Histórico de Pedidos
        </h2>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">Este cliente ainda não realizou pedidos.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-muted/30">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-bold">
                      #{order.friendlyId || order.id.slice(-8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(order.totalAmount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/admin/orders/${order.id}`} passHref>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-all">
                          Ver Detalhes
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-4 text-sm font-medium">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
