"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

interface LoginFormProps {
  tenantId: string;
  tenantName: string;
}

export function LoginForm({ tenantId, tenantName }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tenantId) {
      toast.error("Erro de Identificação", {
        description: "Não foi possível determinar a loja. Acesse por um subdomínio válido.",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, tenantId }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error("Houve um problema", {
          description: result.message || "Usuário ou senha inválidos.",
        });
      } else {
        toast.success("Bem-vindo de volta!", {
          description: "Entrando no Painel Administrativo...",
        });
        router.push("/admin");
      }
    } catch {
      toast.error("Erro de Conexão", {
        description: "Ocorreu um erro ao tentar realizar o login.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Username
        </label>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          disabled={loading || !tenantId}
          required
          className="h-12 border-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-900"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Senha
        </label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={loading || !tenantId}
          required
          className="h-12 border-slate-200 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-900"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="remember"
            className="text-sm font-medium leading-none text-slate-600 cursor-pointer"
          >
            Lembrar-me
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={loading || !tenantId}
        className="w-full h-12 rounded-lg font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </>
        ) : (
          <>
            <span>Entrar</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </>
        )}
      </Button>
    </form>
  );
}
