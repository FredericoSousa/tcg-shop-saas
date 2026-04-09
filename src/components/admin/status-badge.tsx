import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "ACTIVE" | "INACTIVE" | "ADMIN" | "USER";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200/50",
  },
  PAID: {
    label: "Pago",
    className: "bg-green-100 text-green-800 border-green-200/50",
  },
  SHIPPED: {
    label: "Enviado",
    className: "bg-blue-100 text-blue-800 border-blue-200/50",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 border-red-200/50",
  },
  ACTIVE: {
    label: "Ativo",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200/50",
  },
  INACTIVE: {
    label: "Inativo",
    className: "bg-gray-100 text-gray-800 border-gray-200/50",
  },
  ADMIN: {
    label: "Administrador",
    className: "bg-violet-100 text-violet-800 border-violet-200/50",
  },
  USER: {
    label: "Usuário",
    className: "bg-muted text-muted-foreground border-border/50",
  },
};

interface StatusBadgeProps {
  status: string | StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider border-0 shadow-none",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
