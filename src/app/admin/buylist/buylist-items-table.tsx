'use client'

import { DataTable } from "./data-table"; 
import { buylistItemColumns, BuylistItemRow } from "./columns";

interface BuylistItemsTableProps {
  data: BuylistItemRow[];
}

export function BuylistItemsTable({ data }: BuylistItemsTableProps) {
  return (
    <DataTable 
      columns={buylistItemColumns} 
      data={data}
    />
  );
}
