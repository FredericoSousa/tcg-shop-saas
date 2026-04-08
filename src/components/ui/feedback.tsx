"use client";

import { Loader2, AlertCircle, Inbox, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackProps {
  type: "loading" | "error" | "empty" | "search";
  title?: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function Feedback({ type, title, description, className, icon }: FeedbackProps) {
  const getIcon = () => {
    if (icon) return icon;
    switch (type) {
      case "loading":
        return <Loader2 className="h-10 w-10 animate-spin text-primary/40" />;
      case "error":
        return <AlertCircle className="h-10 w-10 text-destructive/40" />;
      case "empty":
        return <Inbox className="h-10 w-10 text-muted-foreground/40" />;
      case "search":
        return <Search className="h-10 w-10 text-muted-foreground/40" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "loading":
        return "Carregando...";
      case "error":
        return "Algo deu errado";
      case "empty":
        return "Nenhum resultado encontrado";
      case "search":
        return "Comece sua busca";
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500", className)}>
      <div className="mb-4 flex items-center justify-center">
        {getIcon()}
      </div>
      <h3 className="text-lg font-bold tracking-tight text-foreground">
        {getTitle()}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}
