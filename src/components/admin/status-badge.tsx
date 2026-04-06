import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "ACTIVE" | "INACTIVE" | "ADMIN" | "USER";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50",
  },
  PAID: {
    label: "Pago",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50 dark:border-green-800/50",
  },
  SHIPPED: {
    label: "Enviado",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50 dark:border-red-800/50",
  },
  ACTIVE: {
    label: "Ativo",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
  },
  INACTIVE: {
    label: "Inativo",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200/50 dark:border-gray-700/50",
  },
  ADMIN: {
    label: "Administrador",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/50",
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
