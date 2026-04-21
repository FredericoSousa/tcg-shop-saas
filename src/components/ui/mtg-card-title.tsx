import { cn } from "@/lib/utils";

interface MTGCardTitleProps {
  name: string;
  className?: string;
  mainClassName?: string;
  secondaryClassName?: string;
  truncate?: boolean;
  showSecondary?: boolean;
}

export function MTGCardTitle({
  name,
  className,
  mainClassName,
  secondaryClassName,
  truncate = true,
  showSecondary = true,
}: MTGCardTitleProps) {
  if (!name) return null;

  const isSplit = name.includes(" // ");

  if (!isSplit) {
    return (
      <span
        className={cn(
          "font-semibold",
          truncate && "truncate",
          mainClassName,
          className,
        )}
      >
        {name}
      </span>
    );
  }

  const [front, back] = name.split(" // ");

  return (
    <div className={cn("flex flex-col min-w-0", className)}>
      <span
        className={cn(
          "font-semibold leading-tight",
          truncate && "truncate",
          mainClassName,
        )}
      >
        {front.trim()}
      </span>
      {showSecondary && (
        <span
          className={cn(
            "text-2xs text-muted-foreground font-medium leading-tight truncate",
            secondaryClassName,
          )}
        >
          {back.trim()}
        </span>
      )}
    </div>
  );
}
