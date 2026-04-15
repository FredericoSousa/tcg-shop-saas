"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SetBadge } from "@/components/ui/set-badge";
import { formatCurrency } from "@/lib/utils/format";

interface LiveSearchProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  onResultClick?: () => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  searchPath?: string;
  resultPathType?: "singles" | "buylist";
}

interface SearchResult {
  id: string;
  name: string;
  set: string;
  price: number;
  imageUrl?: string;
}

export function LiveSearch({ 
  defaultValue = "", 
  onSearch, 
  onResultClick,
  className, 
  inputClassName, 
  placeholder = "Buscar cartas...",
  searchPath = "/api/search",
  resultPathType = "singles"
}: LiveSearchProps) {
  const [query, setQuery] = useState(defaultValue);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2 && query.trim() !== defaultValue.trim()) {
        setIsLoading(true);
        try {
          const res = await fetch(`${searchPath}?q=${encodeURIComponent(query.trim())}`);
          const data = await res.json();
          setResults(data.items || []);
          setIsOpen(true);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, defaultValue, searchPath]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query.trim());
    } else {
      if (query.trim()) {
        router.push(`/${resultPathType}?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push(`/${resultPathType}`);
      }
    }
    setIsOpen(false);
    if (onResultClick) onResultClick();
  };

  const handleResultClick = () => {
    setIsOpen(false);
    if (onResultClick) onResultClick();
  };

  return (
    <div className={`relative w-full ${className || ""}`} ref={dropdownRef}>
      <form onSubmit={handleSearch} className="relative z-50">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </div>
        <Input
          type="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          className={`pl-10 pr-4 bg-zinc-50 border-zinc-200 text-zinc-900 h-10 rounded-xl focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-zinc-500 font-medium text-sm ${inputClassName || ""}`}
        />
      </form>

      {/* Live Search Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-white border border-zinc-100 rounded-2xl shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-0.5 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {results.map((item) => (
              <Link
                key={item.id}
                href={resultPathType === "buylist" ? `/buylist?q=${encodeURIComponent(item.name)}` : `/singles/${item.id}`}
                onClick={handleResultClick}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-all group"
              >
                <div className="h-12 w-9 bg-zinc-100 rounded overflow-hidden flex-shrink-0 border border-zinc-100 relative">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-zinc-900 truncate">{item.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <SetBadge setCode={item.set} showText={false} iconClassName="h-3 w-3" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{item.set}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-primary text-xs">{formatCurrency(item.price)}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-2 border-t border-zinc-50 mt-1">
            <button
              onClick={handleSearch}
              className="w-full py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-950 transition-colors"
            >
              Ver todos os resultados
            </button>
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-3 p-6 bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 text-center animate-in fade-in slide-in-from-top-2">
          <p className="text-zinc-500 text-sm font-medium">Nenhum card encontrado para &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
