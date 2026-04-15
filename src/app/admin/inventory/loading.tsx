import { Skeleton } from "@/components/ui/skeleton"

export default function InventoryLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Mimic PageHeader skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 lg:p-0">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>

      <div className="space-y-4">
        {/* Mimic FilterSection skeleton */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-10 w-full sm:w-64 rounded-lg" />
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-10 w-[150px] rounded-lg" />
            <Skeleton className="h-10 w-[150px] rounded-lg" />
            <Skeleton className="h-10 w-[120px] rounded-lg" />
            <Skeleton className="h-10 w-[150px] rounded-lg" />
          </div>
        </div>

        {/* Mimic Table skeleton */}
        <div className="rounded-2xl border border-zinc-200/50 bg-card/30 shadow-sm overflow-hidden">
          <div className="h-12 border-b bg-muted/20" />
          <div className="p-0">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center border-b p-4 gap-4 last:border-0">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

