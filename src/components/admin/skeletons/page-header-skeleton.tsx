import { Skeleton } from "@/components/ui/skeleton";

interface PageHeaderSkeletonProps {
  actions?: number;
}

export function PageHeaderSkeleton({ actions = 0 }: PageHeaderSkeletonProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/40 p-5 md:p-6 rounded-2xl border shadow-sm backdrop-blur-sm bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center gap-4">
        <Skeleton className="h-[42px] w-[42px] rounded-xl shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {actions > 0 && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {Array.from({ length: actions }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}
