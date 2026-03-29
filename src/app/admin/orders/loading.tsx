import { Skeleton } from "@/components/ui/skeleton"

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-lg" />
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border p-4 md:p-6 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20 border-b">
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex items-center gap-6">
                <div className="space-y-2 text-right">
                  <Skeleton className="h-3 w-20 ml-auto" />
                  <Skeleton className="h-8 w-24 ml-auto" />
                </div>
                <Skeleton className="h-10 w-[140px]" />
              </div>
            </div>
            <div className="p-5">
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
