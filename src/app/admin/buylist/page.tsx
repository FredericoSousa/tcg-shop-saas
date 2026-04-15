import { container } from "@/lib/infrastructure/container";
import { ListBuylistItemsUseCase } from "@/lib/application/use-cases/list-buylist-items.use-case";
import { ListBuylistProposalsUseCase } from "@/lib/application/use-cases/list-buylist-proposals.use-case";
import { getAdminContext } from "@/lib/tenant-server";
import { PageHeader } from "@/components/admin/page-header";
import { HandCoins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuylistItemsTable } from "./buylist-items-table";
import { BuylistProposalsTable } from "./buylist-proposals-table";
import { AddBuylistItemDialog } from "./add-buylist-item-dialog";

const listItemsUseCase = container.resolve(ListBuylistItemsUseCase);
const listProposalsUseCase = container.resolve(ListBuylistProposalsUseCase);

export default async function AdminBuylistPage() {
  const { tenant } = await getAdminContext();
  const rawItems = await listItemsUseCase.execute(tenant.id);
  const proposals = await listProposalsUseCase.execute(tenant.id);

  // Filter and map to match BuylistItemRow type
  const items = rawItems
    .filter(i => i.cardTemplate)
    .map(i => ({
      id: i.id,
      priceCash: i.priceCash,
      priceCredit: i.priceCredit,
      active: i.active,
      cardTemplate: {
        name: i.cardTemplate!.name,
        set: i.cardTemplate!.set,
        imageUrl: i.cardTemplate!.imageUrl
      }
    }));

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Buylist"
        description="Configure as cartas que deseja comprar e gerencie as propostas enviadas pelos clientes."
        icon={HandCoins}
        actions={<AddBuylistItemDialog />}
      />

      <Tabs defaultValue="proposals" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="proposals">Propostas ({proposals.length})</TabsTrigger>
          <TabsTrigger value="config">Lista de Compra ({items.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="proposals" className="mt-6 border rounded-xl bg-card/40 backdrop-blur-sm overflow-hidden p-0">
          <BuylistProposalsTable data={proposals} />
        </TabsContent>
        <TabsContent value="config" className="mt-6 border rounded-xl bg-card/40 backdrop-blur-sm overflow-hidden p-0">
          <BuylistItemsTable data={items} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
