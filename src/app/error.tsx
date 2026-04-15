'use client';

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { logger } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our structured logger
    logger.error("Global application error", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 px-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-destructive/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Ops! Algo deu errado</CardTitle>
          <p className="text-muted-foreground mt-2 text-sm">
            Ocorreu um erro inesperado no sistema.
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <div className="bg-muted p-3 rounded-md text-xs text-left font-mono overflow-auto max-h-32 mb-4">
            {error.message || "Erro desconhecido"}
            {error.digest && <div className="mt-1 text-primary">ID: {error.digest}</div>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button onClick={() => reset()} className="w-full gap-2">
            <RefreshCcw className="w-4 h-4" />
            Tentar novamente
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-full")}>
            Ir para Início
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
