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
      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
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
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: (
        <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
      ),
      text: "text-blue-900 dark:text-blue-100",
      textColor: "text-blue-600 dark:text-blue-400",
      barColor: "bg-blue-500 dark:bg-blue-500",
    },
    parsing: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800",
      icon: (
        <Loader2 className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-spin" />
      ),
      text: "text-purple-900 dark:text-purple-100",
      textColor: "text-purple-600 dark:text-purple-400",
      barColor: "bg-purple-500 dark:bg-purple-500",
    },
    validating: {
      bg: "bg-yellow-50 dark:bg-yellow-950/30",
      border: "border-yellow-200 dark:border-yellow-800",
      icon: (
        <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
      ),
      text: "text-yellow-900 dark:text-yellow-100",
      textColor: "text-yellow-600 dark:text-yellow-400",
      barColor: "bg-yellow-500 dark:bg-yellow-500",
    },
    completed: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
      icon: (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
      ),
      text: "text-emerald-900 dark:text-emerald-100",
      textColor: "text-emerald-600 dark:text-emerald-400",
      barColor: "bg-emerald-500 dark:bg-emerald-500",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: (
        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
      ),
      text: "text-red-900 dark:text-red-100",
      textColor: "text-red-600 dark:text-red-400",
      barColor: "bg-red-500 dark:bg-red-500",
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
      <div className="px-4 md:px-5 py-3 bg-background/50 dark:bg-background/20">
        <div className="h-2.5 bg-muted/30 dark:bg-muted/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${style.barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 md:px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-inherit bg-muted/20 dark:bg-muted/10">
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
        <div className="px-4 md:px-5 py-2 bg-muted/30 dark:bg-muted/20 text-xs text-muted-foreground font-mono border-t border-inherit">
          status: {progress.status} | page: {progress.currentPage}/
          {progress.totalPages} | eta:{" "}
          {(progress.estimatedTimeRemaining / 1000).toFixed(1)}s
        </div>
      )}
    </div>
  );
}
