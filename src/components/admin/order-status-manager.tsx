"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatus } from "@prisma/client";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "SHIPPED", label: "Enviado" },
  { value: "CANCELLED", label: "Cancelado" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-500 hover:bg-yellow-600",
  PAID: "bg-green-500 hover:bg-green-600",
  SHIPPED: "bg-blue-500 hover:bg-blue-600",
  CANCELLED: "bg-red-500 hover:bg-red-600",
};

interface OrderStatusManagerProps {
  orderId: string;
  currentStatus: OrderStatus;
  variant?: "select" | "compact";
  showLabel?: boolean;
  onStatusChange?: (newStatus: OrderStatus) => void;
}

export function OrderStatusManager({
  orderId,
  currentStatus,
  variant = "compact",
  showLabel = false,
  onStatusChange,
}: OrderStatusManagerProps) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (newStatus: string | null) => {
    if (!newStatus) return;
    const newStatusValue = newStatus as OrderStatus;
    setStatus(newStatusValue);

    startTransition(async () => {
      const response = await fetch("/api/orders/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatusValue }),
      });
      const result = await response.json();
      if (result.success) {
        toast.success(
          `Status alterado para ${STATUS_OPTIONS.find((opt) => opt.value === newStatusValue)?.label}.`,
        );
        onStatusChange?.(newStatusValue);
      } else {
        toast.error(result.message || "Erro ao atualizar status do pedido.");
        setStatus(currentStatus);
      }
    });
  };

  if (variant === "select") {
    const currentLabel = STATUS_OPTIONS.find(
      (opt) => opt.value === status,
    )?.label;
    return (
      <div className="w-[140px]">
        <Select
          value={status}
          disabled={isPending}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger
            className={`font-bold h-9 border-0 text-white uppercase tracking-wider text-xs ${STATUS_COLORS[status]}`}
          >
            <SelectValue placeholder="Status">{currentLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className={`font-bold ${
                  option.value === "PENDING"
                    ? "text-yellow-600"
                    : option.value === "PAID"
                      ? "text-green-600"
                      : option.value === "SHIPPED"
                        ? "text-blue-600"
                        : "text-red-600"
                }`}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // compact variant (default) - original OrderStatusEditor style
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isPending}
          className="px-3 py-2 rounded-lg border border-border/50 bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 cursor-pointer"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {status !== currentStatus && (
          <Button
            size="sm"
            onClick={() => handleStatusChange(status)}
            disabled={isPending}
            className="transition-all duration-200"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </div>
      {status === currentStatus && showLabel && (
        <p className="text-xs text-muted-foreground">
          Clique para alterar o status
        </p>
      )}
    </div>
  );
}
