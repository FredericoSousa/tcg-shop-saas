import { PageHeader } from "@/components/admin/page-header";
import { ShoppingBag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { container } from "@/lib/infrastructure/container";
import { ListProductsUseCase } from "@/lib/application/use-cases/list-products.use-case";
import { ListCategoriesUseCase } from "@/lib/application/use-cases/list-categories.use-case";
import { ProductDialog } from "./product-dialog";
import { CategoriesDialog } from "./categories-dialog";

const listProductsUseCase = container.resolve(ListProductsUseCase);
const listCategoriesUseCase = container.resolve(ListCategoriesUseCase);

export default async function ProductsPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page) || 1;
  const limit = Number(searchParams?.limit) || 10;
  const search = typeof searchParams?.search === "string" ? searchParams.search : undefined;
  const categoryId = typeof searchParams?.category === "string" ? searchParams.category : undefined;

  const { items, pageCount, total } = await listProductsUseCase.execute({ page, limit, search, categoryId });
  const categories = await listCategoriesUseCase.execute();

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Produtos"
        description="Gerencie seus produtos não-TCG como acessórios, embalagens e colecionáveis."
        icon={ShoppingBag}
        actions={
          <div className="flex gap-2">
            <CategoriesDialog categories={categories} />
            <ProductDialog categories={categories}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Produto
              </Button>
            </ProductDialog>
          </div>
        }
      />

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden p-0">
        <DataTable data={items} pageCount={pageCount} total={total} categories={categories} />
      </div>
    </div>
  );
}
