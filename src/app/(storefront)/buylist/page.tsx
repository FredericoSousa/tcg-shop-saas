import { getTenant } from "@/lib/tenant-server";
import { container } from "@/lib/infrastructure/container";
import { ListBuylistItemsUseCase } from "@/lib/application/use-cases/list-buylist-items.use-case";
import { BuylistClient } from "./buylist-client";
import { Sparkles } from "lucide-react";

const listItemsUseCase = container.resolve(ListBuylistItemsUseCase);

export default async function BuylistPage() {
  const tenant = await getTenant();

  if (!tenant) {
    return (
      <div className="p-8 text-center pt-24 min-h-screen flex items-center justify-center bg-muted/20">
        <div className="bg-white p-12 rounded-2xl shadow-sm border max-w-md w-full space-y-4">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <Sparkles className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h1 className="text-2xl font-black mb-2">Loja não encontrada</h1>
        </div>
      </div>
    );
  }

  const items = await listItemsUseCase.execute(tenant.id);
  const activeItems = items.filter(i => i.active);

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl font-black tracking-tight lg:text-4xl text-foreground">Buylist</h1>
          <p className="text-muted-foreground mt-2 text-lg">Vendemos as suas cartas. Veja o que estamos comprando hoje.</p>
        </header>

        <BuylistClient initialItems={activeItems} />
      </div>
    </main>
  );
}
