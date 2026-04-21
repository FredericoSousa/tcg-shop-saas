"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Zap } from "lucide-react";
import type { ImportProgress } from "@/lib/scrapers/liga-magic-scraper";

interface ImportProgressDisplayProps {
  progress: ImportProgress | null;
  isImporting: boolean;
  title?: string;
}

export function ImportProgressDisplay({
  progress,
  isImporting,
  title = "Importando coleção...",
}: ImportProgressDisplayProps) {
  if (!isImporting && !progress) {
    return null;
  }

  if (!progress) {
    return (
      <div className="p-4 bg-info-muted border border-info/20 rounded-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-info animate-spin" />
          <span className="text-sm font-medium text-info">
            {title}
          </span>
        </div>
      </div>
    );
  }

  const percentage =
    progress.totalPages > 0
      ? Math.round((progress.currentPage / progress.totalPages) * 100)
      : 0;

  const statusStyles = {
    fetching: {
      bg: "bg-info-muted",
      border: "border-info/20",
      icon: (
        <Loader2 className="h-5 w-5 text-info animate-spin" />
      ),
      text: "text-info",
      textColor: "text-info",
      barColor: "bg-info",
    },
    parsing: {
      bg: "bg-primary/10",
      border: "border-primary/20",
      icon: (
        <Loader2 className="h-5 w-5 text-primary animate-spin" />
      ),
      text: "text-primary",
      textColor: "text-primary",
      barColor: "bg-primary",
    },
    validating: {
      bg: "bg-warning-muted",
      border: "border-warning/20",
      icon: (
        <Loader2 className="h-5 w-5 text-warning animate-spin" />
      ),
      text: "text-warning",
      textColor: "text-warning",
      barColor: "bg-warning",
    },
    completed: {
      bg: "bg-success-muted",
      border: "border-success/20",
      icon: (
        <CheckCircle2 className="h-5 w-5 text-success" />
      ),
      text: "text-success",
      textColor: "text-success",
      barColor: "bg-success",
    },
    error: {
      bg: "bg-destructive-muted",
      border: "border-destructive/20",
      icon: (
        <AlertTriangle className="h-5 w-5 text-destructive" />
      ),
      text: "text-destructive",
      textColor: "text-destructive",
      barColor: "bg-destructive",
    },
  };

  const style = statusStyles[progress.status];

  const statusLabel = {
    fetching: "Buscando páginas",
    parsing: "Analisando cards",
    validating: "Validando dados",
    completed: "Concluído!",
    error: "Erro na importação",
  }[progress.status];

  return (
    <div
      className={`${style.bg} border ${style.border} rounded-xl overflow-hidden shadow-sm backdrop-blur-sm`}
    >
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {style.icon}
          <div>
            <p className={`text-sm font-semibold ${style.text}`}>
              {statusLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Página {progress.currentPage} de {progress.totalPages} •{" "}
              <span className={style.textColor}>
                {progress.cardsProcessed} cards
              </span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold tabular-nums ${style.textColor}`}>
            {percentage}%
          </p>
          <p className="text-xs text-muted-foreground">
            {progress.speed.toFixed(1)} cards/s
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 md:px-5 py-3 bg-background/50">
        <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${style.barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 md:px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-inherit bg-muted/20">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Cards
          </p>
          <p className={`text-lg font-bold tabular-nums ${style.textColor}`}>
            {progress.cardsProcessed}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Validação
          </p>
          <p className={`text-lg font-bold tabular-nums ${style.textColor}`}>
            {progress.validationRate.toFixed(1)}%
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tempo Restante
          </p>
          <p className={`text-lg font-bold tabular-nums ${style.textColor}`}>
            {progress.status === "completed"
              ? "—"
              : progress.status === "error"
                ? "—"
                : `${progress.estimatedTimeRemainingSeconds.toFixed(0)}s`}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Velocidade
          </p>
          <p className={`text-lg font-bold tabular-nums ${style.textColor}`}>
            <Zap className="h-3.5 w-3.5 inline mr-1 align-text-bottom" />
            {progress.speed.toFixed(1)}/s
          </p>
        </div>
      </div>

      {/* Debug info */}
      {process.env.NODE_ENV === "development" && (
        <div className="px-4 md:px-5 py-2 bg-muted/30 text-xs text-muted-foreground font-mono border-t border-inherit">
          status: {progress.status} | page: {progress.currentPage}/
          {progress.totalPages} | eta:{" "}
          {(progress.estimatedTimeRemaining / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
