import { ColumnDef } from "@tanstack/react-table";
import { ProductActions } from "./product-actions";
import Image from "next/image";

export type ProductColumn = {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string | null;
  imageUrl: string | null;
  active: boolean;
  category: {
    id: string;
    name: string;
  };
};

export const createColumns = (categories: { id: string; name: string }[]): ColumnDef<ProductColumn, unknown>[] => [
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
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "stock",
    header: "Qtd",
    cell: ({ row }) => {
      const stock = row.original.stock;
      return (
        <div className={`font-bold ${stock <= 5 ? "text-destructive" : "text-foreground"}`}>
          {stock}
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
