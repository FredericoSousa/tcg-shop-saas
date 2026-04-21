import { ColumnDef } from "@tanstack/react-table";
import { ProductActions } from "./product-actions";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export type ProductColumn = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  allowNegativeStock: boolean;
  category: {
    id: string;
    name: string;
  };
};

export const createColumns = (categories: { id: string; name: string }[]): ColumnDef<ProductColumn, unknown>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(checked: boolean) => table.toggleAllPageRowsSelected(!!checked)}
        aria-label="Selecionar todos"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(checked: boolean) => row.toggleSelected(!!checked)}
        aria-label="Selecionar linha"
      />
    ),

    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex items-center gap-3">
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-cover border"
            />
          )}
          <div className="flex flex-col">
            <span className="font-medium">{product.name}</span>
            <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
              {product.description || "Sem descrição"}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "category.name",
    header: "Categoria",
  },
  {
    accessorKey: "price",
    header: "Preço",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"));
      return <div className="font-medium">{formatCurrency(price)}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: "Qtd",
    cell: ({ row }) => {
      const stock = row.original.stock;
      const isCritical = stock <= 3;
      const isWarning = stock <= 10;
      
      return (
        <div className="flex items-center gap-2">
          <div className={`font-bold px-2 py-0.5 rounded-full text-xs ${
            isCritical ? "bg-destructive/10 text-destructive border border-destructive/20" : 
            isWarning ? "bg-warning-muted text-warning border border-warning/20" :
            "text-foreground"
          }`}>
            {stock}
          </div>
          {isCritical && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" title="Estoque Crítico" />
          )}
        </div>
      );
    },

  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      return <ProductActions product={product} categories={categories} />;
    },
  },
];
