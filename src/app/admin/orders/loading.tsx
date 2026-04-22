import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/admin/skeletons/page-header-skeleton";

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* PageHeader: icon + title + description, sem actions */}
      <PageHeaderSkeleton />

      {/* Orders table container */}
      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
        {/* FilterSection: search + 2 selects + customer filter */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 border-b">
          <Skeleton className="h-9 w-full lg:w-64 rounded-lg" />
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-9 w-[140px] rounded-lg" />
            <Skeleton className="h-9 w-[140px] rounded-lg" />
          </div>
        </div>

        {/* Table header: checkbox, ID/Data, Itens, Cliente, Origem, Qtd, Total, Status, menu */}
        <div className="h-11 border-b bg-muted/30 flex items-center px-4 gap-4">
          <Skeleton className="h-4 w-4 rounded shrink-0" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 flex-1 max-w-[160px] rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-10 rounded ml-auto" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-6 rounded" />
        </div>

        {/* Table rows — 8 to match page limit */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center px-4 py-3 gap-4 border-b last:border-0">
            <Skeleton className="h-4 w-4 rounded shrink-0" />
            <div className="space-y-1.5 w-20 shrink-0">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            {/* Card thumbnails */}
            <div className="flex -space-x-2 shrink-0">
              <Skeleton className="h-10 w-7 rounded-md border-2 border-background shrink-0" />
              <Skeleton className="h-10 w-7 rounded-md border-2 border-background shrink-0" />
              <Skeleton className="h-10 w-7 rounded-md border-2 border-background shrink-0" />
            </div>
            <Skeleton className="h-4 flex-1 max-w-[140px]" />
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
            <Skeleton className="h-4 w-8 shrink-0 ml-auto" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-6 w-20 rounded-full shrink-0" />
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
