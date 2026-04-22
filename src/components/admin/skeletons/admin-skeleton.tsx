import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "./page-header-skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* PageHeader: title + description + 2 action buttons */}
      <PageHeaderSkeleton actions={2} />

      {/* KPI Cards: 4 cards com icon badge à direita */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-card border border-border p-5 flex items-start justify-between gap-4 shadow-sm">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          </div>
        ))}
      </div>

      {/* Analytics section: heading + 4 KPI cards + 2 chart cards */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-1">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card/40 shadow-sm p-6 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[340px] rounded-xl" />
          <Skeleton className="h-[340px] rounded-xl" />
        </div>
      </div>

      {/* Bottom grid: TopProducts + TopBuyers + DashboardChart */}
      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card/40 shadow-sm overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="p-6 space-y-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card/40 shadow-sm overflow-hidden h-full">
            <div className="p-6 border-b flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-full min-h-[300px] rounded-xl" />
        </div>
      </div>

      {/* Recent orders section */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-5 border-b last:border-0 gap-5">
              <div className="flex items-center gap-5">
                <div className="hidden sm:flex -space-x-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-12 w-9 rounded-lg border-2 border-background shrink-0" />
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
      <div className="rounded-xl border">
        <div className="h-10 border-b flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-full" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
