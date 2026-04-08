"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, User, Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CustomerType {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
}

interface CustomerSelectorProps {
  onSelect: (customer: CustomerType | null) => void;
  selectedCustomer: CustomerType | null;
  hideLabel?: boolean;
  size?: "sm" | "default";
}

export function CustomerSelector({ 
  onSelect, 
  selectedCustomer,
  hideLabel = false,
  size = "default" 
}: CustomerSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen || query.length < 2) {
      if (query.length === 0 && isOpen) {
          handleSearch("");
      }
      return;
    }

    const handler = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  const handleSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(searchQuery)}&limit=5`);
      const result = await response.json();
      if (result.success && result.data) {
        setResults(result.data.items || []);
      }
    } catch (error) {
      console.error("Customer search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {!hideLabel && (
        <label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 flex items-center gap-2">
          <User className="h-3 w-3" /> Cliente
        </label>
      )}
      
      {selectedCustomer ? (
        <div className={cn(
          "flex items-center justify-between rounded-lg border bg-primary/5 border-primary/20",
          size === "sm" ? "p-2 h-9" : "p-3 h-11"
        )}>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{selectedCustomer.name}</p>
              <p className="text-xs text-muted-foreground">{selectedCustomer.phoneNumber}</p>
            </div>
          </div>
          <button 
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            className="p-1 hover:bg-muted rounded-full"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Buscar por nome ou telefone..."
            className={cn("pl-9", size === "sm" ? "h-9" : "h-11")}
          />
          
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length > 0 ? (
                <div className="max-h-[250px] overflow-y-auto">
                  {results.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => {
                        onSelect(customer);
                        setIsOpen(false);
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.phoneNumber}</p>
                      </div>
                      <Check className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-center text-muted-foreground">
                  Nenhum cliente encontrado
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
