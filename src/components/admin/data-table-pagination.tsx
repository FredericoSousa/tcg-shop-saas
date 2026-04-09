"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as React from "react";

interface DataTablePaginationProps {
  page: number;
  pageCount: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: number[];
}

export function DataTablePagination({
  page,
  pageCount,
  total,
  limit,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [8, 10, 20, 30, 40, 50],
}: DataTablePaginationProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  
  const [goToPage, setGoToPage] = React.useState("");

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(goToPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pageCount) {
      onPageChange(pageNum);
      setGoToPage("");
    }
  };

  // Improved pagination logic
  const getPageNumbers = () => {
    const pages = [];
    const showMax = 5; // Number of page buttons to show (excluding first/last and ellipses)
    
    if (pageCount <= showMax + 4) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(1);
      
      const start = Math.max(2, page - 1);
      const end = Math.min(pageCount - 1, page + 1);
      
      if (start > 2) pages.push("ellipsis-start");
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < pageCount - 1) pages.push("ellipsis-end");
      
      pages.push(pageCount);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-muted/50 mt-4">
      <div className="flex flex-col xs:flex-row items-center gap-4 sm:gap-6 order-2 sm:order-1 w-full sm:w-auto justify-between sm:justify-start">
        <div className="text-sm text-muted-foreground font-medium">
          Mostrando <span className="font-bold text-foreground">{total > 0 ? startItem : 0}-{endItem}</span> de{" "}
          <span className="font-bold text-foreground">{total}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground hidden md:block">
              Linhas:
            </p>
            <Select
              value={`${limit}`}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px] font-bold" aria-label="Selecionar quantidade de linhas por página">
                <SelectValue placeholder={limit} />
              </SelectTrigger>
              <SelectContent side="top">
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {pageCount > 5 && (
            <form onSubmit={handleGoToPage} className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground hidden lg:block">Ir para:</p>
              <input
                type="text"
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value.replace(/\D/g, ""))}
                className="h-8 w-12 rounded-md border border-input bg-background px-2 py-1 text-xs font-bold text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Pág."
                aria-label="Página específica"
              />
            </form>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 font-bold gap-1 px-3 transition-all hover:scale-105 active:scale-95"
          aria-label="Ir para a página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-1" role="navigation" aria-label="Navegação por páginas">
          {getPageNumbers().map((p, i) => {
            if (p === "ellipsis-start" || p === "ellipsis-end") {
              return (
                <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground text-xs font-bold select-none">
                  ...
                </span>
              );
            }
            
            const isCurrent = page === p;
            return (
              <Button
                key={p}
                variant={isCurrent ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(p as number)}
                className={`h-8 w-8 p-0 font-bold transition-all ${
                  isCurrent ? "shadow-md scale-110" : "hover:bg-muted/50"
                }`}
                aria-label={`Ir para a página ${p}`}
                aria-current={isCurrent ? "page" : undefined}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page === pageCount || pageCount === 0}
          onClick={() => onPageChange(page + 1)}
          className="h-8 font-bold gap-1 px-3 transition-all hover:scale-105 active:scale-95"
          aria-label="Ir para a próxima página"
        >
          <span className="hidden xs:inline">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
