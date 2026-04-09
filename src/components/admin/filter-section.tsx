"use client";

import * as React from "react";
import { FilterIcon } from "lucide-react";

interface FilterSectionProps {
  children: React.ReactNode;
  resultsCount?: number;
}

export function FilterSection({ children, resultsCount }: FilterSectionProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm overflow-visible animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg">
          <FilterIcon className="w-4 h-4 text-primary" />
        </div>
        <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">
          Filtrar:
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 overflow-visible">
        {children}
      </div>

      {resultsCount !== undefined && (
        <div className="text-xs text-muted-foreground font-medium bg-muted/30 px-3 py-1.5 rounded-full border self-start lg:self-center">
          <span className="font-bold text-primary">{resultsCount}</span> resultados
        </div>
      )}
    </div>
  );
}
