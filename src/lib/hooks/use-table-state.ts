"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export interface TableStateOptions {
  baseUrl?: string;
  defaultLimit?: number;
}

export function useTableState(options: TableStateOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { defaultLimit = 10 } = options;

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || defaultLimit;
  const search = searchParams.get("search") || "";

  const getFilter = useCallback(
    (key: string) => searchParams.get(key) || "",
    [searchParams]
  );

  const createQueryString = useCallback(
    (params: Record<string, string | number | null>) => {
      const newSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === "") {
          newSearchParams.delete(key);
        } else {
          newSearchParams.set(key, String(value));
        }
      }

      return newSearchParams.toString();
    },
    [searchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const query = createQueryString({ page: newPage });
      startTransition(() => {
        router.push(`${pathname}?${query}`, { scroll: false });
      });
    },
    [createQueryString, pathname, router]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      const query = createQueryString({ limit: newLimit, page: 1 });
      startTransition(() => {
        router.push(`${pathname}?${query}`, { scroll: false });
      });
    },
    [createQueryString, pathname, router]
  );

  const setSearch = useCallback(
    (newSearch: string) => {
      const query = createQueryString({ search: newSearch, page: 1 });
      startTransition(() => {
        router.replace(`${pathname}?${query}`, { scroll: false });
      });
    },
    [createQueryString, pathname, router]
  );

  const setFilter = useCallback(
    (key: string, value: string | number | null) => {
      const query = createQueryString({ [key]: value, page: 1 });
      startTransition(() => {
        router.push(`${pathname}?${query}`, { scroll: false });
      });
    },
    [createQueryString, pathname, router]
  );

  const clearFilters = useCallback(
    (keys: string[]) => {
      const params: Record<string, string | number | null> = {};
      keys.forEach((key) => {
        params[key] = null;
      });
      params.search = null;
      params.page = 1;
      
      const query = createQueryString(params);
      startTransition(() => {
        router.push(`${pathname}?${query}`, { scroll: false });
      });
    },
    [createQueryString, pathname, router]
  );

  return {
    page,
    limit,
    search,
    getFilter,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    clearFilters,
    isPending,
  };
}
