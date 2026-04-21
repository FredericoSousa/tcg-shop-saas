import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusType = "PENDING" | "PAID" | "SHIPPED" | "CANCELLED" | "ACTIVE" | "INACTIVE" | "ADMIN" | "USER";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  PENDING: {
    label: "Pendente",
    className: "bg-warning-muted text-warning border-warning/20",
  },
  PAID: {
    label: "Pago",
    className: "bg-success-muted text-success border-success/20",
  },
  SHIPPED: {
    label: "Enviado",
    className: "bg-info-muted text-info border-info/20",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-destructive-muted text-destructive border-destructive/20",
  },
  ACTIVE: {
    label: "Ativo",
    className: "bg-success-muted text-success border-success/20",
  },
  INACTIVE: {
    label: "Inativo",
    className: "bg-muted text-muted-foreground border-border/50",
  },
  ADMIN: {
    label: "Administrador",
    className: "bg-primary/10 text-primary border-primary/20",
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
        "px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider border-0 shadow-none",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
