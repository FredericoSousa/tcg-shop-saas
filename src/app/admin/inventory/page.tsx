import "reflect-metadata";
import { container } from "@/lib/infrastructure/container";
import { ListInventoryUseCase } from "@/lib/application/use-cases/list-inventory.use-case";
import { getAdminContext } from "@/lib/tenant-server";
import { PageHeader } from "@/components/admin/page-header";
import { Package, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { AddCardDialog } from "./add-card-dialog";

export default async function InventoryPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = typeof searchParams?.search === "string" ? searchParams.search : undefined;

  const { tenant } = await getAdminContext();
  
  const listInventory = container.resolve(ListInventoryUseCase);
  const { items: rawInventory, pageCount } = await listInventory.execute({ 
    page, 
    limit, 
    search 
  });

  const inventory = rawInventory.map((item) => ({
    id: item.id,
    price: Number(item.price), // converting Prisma Decimal to Number for client
    quantity: item.quantity,
    condition: item.condition,
    language: item.language,
    extras: item.extras,
    cardTemplate: item.cardTemplate ? {
      name: item.cardTemplate.name,
      set: item.cardTemplate.set,
      imageUrl: item.cardTemplate.imageUrl,
      metadata: item.cardTemplate.metadata as Record<string, unknown> | null,
    } : {
      name: "Desconhecido",
      set: "---",
      imageUrl: null,
      metadata: null
    },
  }));

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Singles"
        description={`Gerencie o inventário da loja ${tenant?.name || "sua loja"}`}
        icon={Package}
        actions={
          <>
            <Link href="/admin/inventory/bulk-import">
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Importar em Massa
              </Button>
            </Link>
            <AddCardDialog />
          </>
        }
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden">
        <DataTable columns={columns} data={inventory} pageCount={pageCount} />
      </div>
    </div>
  );
}
