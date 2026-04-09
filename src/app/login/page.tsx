"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantLogo, setTenantLogo] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Get tenantId from headers that were set by proxy
  useEffect(() => {
    const getTenantInfo = async () => {
      try {
        const response = await fetch("/api/tenant/current");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setTenantId(result.data.id);
            setTenantName(result.data.name);
            setTenantLogo(result.data.logoUrl);
          }
        }
      } catch (err) {
        console.error("Failed to get tenant info:", err);
      }
    };

    getTenantInfo();
  }, []);

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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Left Column: Branding & Info */}
      <div className="hidden lg:flex flex-col justify-center bg-slate-950 p-16 text-white relative overflow-hidden">
        {/* Subtle Decorative elements */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">TCG Shop SaaS</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl font-black leading-tight tracking-tighter">
              Gestão inteligente <br />
              para sua loja.
            </h1>
            <p className="text-slate-400 text-xl leading-relaxed max-w-md">
              A plataforma completa para gerenciar seu inventário, vendas e clientes em um único lugar.
            </p>
          </div>
        </div>

        <div className="absolute bottom-12 left-16 z-10 flex items-center gap-6 text-slate-500 text-xs">
          <p>© 2026 TCG Shop SaaS</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="#" className="hover:text-white transition-colors">Termos</Link>
          </div>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="flex flex-col justify-center items-center bg-white p-8 md:p-12 lg:p-24 animate-in fade-in duration-700 lg:animate-none">
        <div className="w-full max-w-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">TCG Shop SaaS</h2>
          </div>

          {/* Form Header */}
          <div className="mb-10 lg:text-center text-center">
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">
              {tenantName}
            </h1>
            <p className="text-slate-500">Faça login para continuar</p>
          </div>

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

          {/* Footer Info */}
          <div className="mt-10 text-center space-y-6">

          </div>

        </div>
      </div>
    </div>
  );
}
