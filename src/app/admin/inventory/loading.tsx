import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/admin/skeletons/page-header-skeleton";

export default function InventoryLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* PageHeader: icon + title + description + 2 actions */}
      <PageHeaderSkeleton actions={2} />

      {/* Data table container */}
      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
        {/* Toolbar: search + filters */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 border-b">
          <Skeleton className="h-9 w-full lg:w-64 rounded-lg" />
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-[130px] rounded-lg" />
            <Skeleton className="h-9 w-[130px] rounded-lg" />
            <Skeleton className="h-9 w-[110px] rounded-lg" />
            <Skeleton className="h-9 w-[130px] rounded-lg" />
          </div>
        </div>

        {/* Table header */}
        <div className="h-11 border-b bg-muted/30 flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
          <Skeleton className="h-3 flex-1 max-w-[180px] rounded" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-20 rounded ml-auto" />
          <Skeleton className="h-3 w-8 rounded" />
        </div>

        {/* Table rows — 10 to match page limit */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center px-4 py-3 gap-4 border-b last:border-0">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <Skeleton className="h-12 w-9 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            <Skeleton className="h-4 w-16 shrink-0" />
            <Skeleton className="h-4 w-14 shrink-0" />
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
          </div>
        ))}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
