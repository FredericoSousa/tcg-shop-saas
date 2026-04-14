"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * React Error Boundary para o Admin Panel.
 * Captura erros de renderização e exibe um fallback em vez de quebrar toda a árvore.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 p-8 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
          <div className="text-3xl">⚠️</div>
          <div>
            <h2 className="font-bold text-destructive text-lg mb-1">Algo deu errado</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ocorreu um erro inesperado nesta seção. Tente recarregar a página.
            </p>
            {this.state.error?.message && (
              <pre className="mt-3 text-xs text-left bg-muted rounded-lg p-3 overflow-x-auto max-w-sm">
                {this.state.error.message}
              </pre>
            )}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm font-semibold text-destructive hover:underline"
          >
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
