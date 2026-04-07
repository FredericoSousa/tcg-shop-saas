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
}

export function DataTablePagination({
  page,
  pageCount,
  total,
  limit,
  onPageChange,
  onLimitChange,
}: DataTablePaginationProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-muted/50 mt-4">
      <div className="flex items-center gap-6 order-2 sm:order-1 w-full sm:w-auto justify-between sm:justify-start">
        <div className="text-sm text-muted-foreground font-medium">
          Mostrando <span className="font-bold text-foreground">{total > 0 ? startItem : 0}-{endItem}</span> de{" "}
          <span className="font-bold text-foreground">{total}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-muted-foreground hidden md:block">
            Linhas:
          </p>
          <Select
            value={`${limit}`}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px] font-bold">
              <SelectValue placeholder={limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {[8, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-center sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="h-8 font-bold gap-1 px-3 transition-all hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Anterior</span>
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
            .map((p, i, arr) => {
              const showEllipsis = i > 0 && p - arr[i - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && (
                    <span className="px-1 text-muted-foreground text-xs font-bold">
                      ...
                    </span>
                  )}
                  <Button
                    variant={page === p ? "default" : "ghost"}
                    size="sm"
                    onClick={() => onPageChange(p)}
                    className={`h-8 w-8 p-0 font-bold transition-all ${
                      page === p ? "shadow-md scale-110" : "hover:bg-muted/50"
                    }`}
                  >
                    {p}
                  </Button>
                </React.Fragment>
              );
            })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={page === pageCount || pageCount === 0}
          onClick={() => onPageChange(page + 1)}
          className="h-8 font-bold gap-1 px-3 transition-all hover:scale-105 active:scale-95"
        >
          <span className="hidden xs:inline">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
