import { container } from "@/lib/infrastructure/container";
import { GetCustomerRankingUseCase } from "@/lib/application/use-cases/get-customer-ranking.use-case";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Star, Trophy } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TopBuyersCardProps {
  tenantId: string;
}

export async function TopBuyersCard({ tenantId }: TopBuyersCardProps) {
  const useCase = container.resolve(GetCustomerRankingUseCase);
  const customers = await useCase.execute({ tenantId, limit: 5 });

  return (
    <Card className="bg-card/40 backdrop-blur-sm border shadow-sm rounded-xl overflow-hidden h-full">
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
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-2xs shrink-0 border border-primary/20 shadow-sm">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate max-w-[120px]">{customer.name}</p>
                    <p className="text-2xs text-muted-foreground font-medium">{customer.orderCount} pedidos realizados</p>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm font-black text-foreground tabular-nums">
                    {formatCurrency(customer.totalSpent, { maximumFractionDigits: 0 })}
                  </p>
                  <div className="flex items-center justify-end gap-0.5 mt-0.5">
                    {idx === 0 && (
                      <span className="flex items-center px-1.5 py-0.5 rounded-full bg-success/10 text-2xs font-black tracking-widest text-success uppercase border border-success/20">
                        Top Player
                      </span>
                    )}
                    {idx > 0 && idx < 3 && (
                      <div className="flex gap-0.5">
                        <Star className="h-2 w-2 fill-warning text-warning" />
                        <Star className="h-2 w-2 fill-warning text-warning" />
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
