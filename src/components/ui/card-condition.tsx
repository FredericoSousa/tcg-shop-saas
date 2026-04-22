import { cn } from "@/lib/utils";
import { CONDITION_LABELS } from "@/lib/constants/conditions";

type CardCondition = keyof typeof CONDITION_LABELS;

const CONDITION_STYLES: Record<CardCondition, string> = {
  NM: "bg-success-muted text-success border-success/20",
  SP: "bg-info-muted text-info border-info/20",
  MP: "bg-warning-muted text-warning border-warning/20",
  HP: "bg-warning-muted text-warning border-warning/20",
  D: "bg-destructive/10 text-destructive border-destructive/20",
};

interface CardConditionProps {
  condition: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}

export function CardCondition({
  condition,
  size = "sm",
  showLabel = false,
  className,
}: CardConditionProps) {
  const key = condition as CardCondition;
  const label = CONDITION_LABELS[key] ?? condition;
  const colorClass = CONDITION_STYLES[key] ?? "bg-muted text-muted-foreground border-border";

  if (showLabel) {
    return (
      <span className={cn("font-bold text-zinc-900", className)}>
        {label}
      </span>
    );
  }

  return (
    <span
      title={label}
      className={cn(
        "inline-block font-black uppercase tracking-wider border rounded cursor-help",
        size === "sm" && "text-2xs px-1.5 py-0.5",
        size === "md" && "text-xs px-3 py-1.5 rounded-xl",
        colorClass,
        className,
      )}
    >
      {condition}
    </span>
  );
}
