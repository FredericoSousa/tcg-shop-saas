import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <main className="flex-1 bg-background min-h-screen">
      {/* Hero Skeleton (simulating the banner) */}
      <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white overflow-hidden shadow-2xl h-[450px] flex flex-col justify-center items-center space-y-8">
        <div className="w-24 h-24 bg-white/10 rounded-2xl animate-pulse"></div>
        <Skeleton className="h-16 w-[300px] bg-white/20" />
        <Skeleton className="h-6 w-[450px] bg-white/10" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
