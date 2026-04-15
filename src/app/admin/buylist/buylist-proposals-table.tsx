'use client'

import { DataTable } from "./data-table"; 
import { buylistProposalColumns, BuylistProposalRow } from "./columns";

interface BuylistProposalsTableProps {
  data: BuylistProposalRow[];
}

export function BuylistProposalsTable({ data }: BuylistProposalsTableProps) {
  return (
    <DataTable 
      columns={buylistProposalColumns} 
      data={data}
    />
  );
}
