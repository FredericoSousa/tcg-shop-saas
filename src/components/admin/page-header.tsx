import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/40 p-5 md:p-6 rounded-2xl border border-zinc-200/50 shadow-sm backdrop-blur-md bg-gradient-to-br from-card to-card/50 transition-all duration-300 hover:shadow-lg hover:border-primary/20",
        className
      )}
    >
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="p-3 bg-primary/10 rounded-xl shrink-0 transition-transform group-hover:scale-105">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="text-muted-foreground text-sm md:text-base font-medium">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 animate-in fade-in slide-in-from-right-4 duration-500">
          {actions}
        </div>
      )}
    </div>
  );
}
