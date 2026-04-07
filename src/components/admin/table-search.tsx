"use client";

import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import * as React from "react";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  isLoading = false,
}: TableSearchProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const debouncedValue = useDebounce(localValue, 500);

  // Sync with prop value (e.g. from URL)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Trigger onChange when debounced value changes
  React.useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  return (
    <div className="relative w-full sm:max-w-xs group">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </div>
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        className="pl-9 pr-9 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20 border-muted group-hover:border-muted-foreground/30"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 hover:text-destructive transition-colors"
          type="button"
          aria-label="Limpar busca"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
