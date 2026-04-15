"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 px-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">404</CardTitle>
          <p className="text-muted-foreground mt-2">Página não encontrada</p>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground">
          Não conseguimos encontrar a página que você está procurando. Por favor, verifique o URL ou volte para a página inicial.
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
            Ir para Início
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
