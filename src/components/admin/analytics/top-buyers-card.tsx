import { container } from "@/lib/infrastructure/container";
import { GetCustomerRankingUseCase } from "@/lib/application/use-cases/get-customer-ranking.use-case";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Star, Trophy } from "lucide-react";

interface TopBuyersCardProps {
  tenantId: string;
}

export async function TopBuyersCard({ tenantId }: TopBuyersCardProps) {
  const useCase = container.resolve(GetCustomerRankingUseCase);
  const customers = await useCase.execute({ tenantId, limit: 5 });

  return (
    <Card className="bg-card/40 backdrop-blur-md border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl overflow-hidden h-full transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      <CardHeader className="border-b border-border/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              Melhores Clientes
            </CardTitle>
            <CardDescription className="text-xs">Top 5 compradores por faturamento total</CardDescription>
          </div>
          <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
            <Trophy className="h-4 w-4 text-violet-500" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-zinc-200/10">
          {customers.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-xs font-medium">
              Ainda não há dados de clientes.
            </div>
          ) : (
            customers.map((customer, idx) => (
              <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-[10px] shrink-0 border border-primary/20 shadow-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate max-w-[120px]">{customer.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{customer.orderCount} pedidos realizados</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-black text-foreground tabular-nums">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(customer.totalSpent)}
                  </p>
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    {idx === 0 && (
                      <span className="flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-[8px] font-black tracking-widest text-emerald-500 uppercase border border-emerald-500/20">
                        Top Player
                      </span>
                    )}
                    {idx > 0 && idx < 3 && (
                      <div className="flex gap-0.5">
                        <Star className="h-2 w-2 fill-amber-500 text-amber-500" />
                        <Star className="h-2 w-2 fill-amber-500 text-amber-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
