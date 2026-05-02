"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  initialSearch: string;
  initialActive: "all" | "active" | "inactive";
  total: number;
}

export function TenantsListFilters({ initialSearch, initialActive, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState<Props["initialActive"]>(initialActive);
  const [isPending, startTransition] = useTransition();

  const apply = (next: { search?: string; active?: Props["initialActive"] }) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("page");
    const nextSearch = next.search ?? search;
    const nextActive = next.active ?? activeFilter;
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    else params.delete("search");
    if (nextActive === "all") params.delete("active");
    else params.set("active", nextActive);
    startTransition(() => {
      router.push(`/internal/tenants?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm">
      <form
        className="flex-1 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({ search });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, slug ou email..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>
      </form>

      <Select
        value={activeFilter}
        onValueChange={(value) => {
          const v = value as Props["initialActive"];
          setActiveFilter(v);
          apply({ active: v });
        }}
      >
        <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Todos os status</SelectItem>
          <SelectItem value="active">Apenas ativos</SelectItem>
          <SelectItem value="inactive">Apenas inativos</SelectItem>
        </SelectContent>
      </Select>

      <span className="text-xs text-muted-foreground sm:ml-2 whitespace-nowrap">
        {isPending ? "Atualizando..." : `${total} resultado${total === 1 ? "" : "s"}`}
      </span>
    </div>
  );
}
