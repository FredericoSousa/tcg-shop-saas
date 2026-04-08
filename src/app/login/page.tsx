"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, ShieldCheck, LayoutDashboard } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-950">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/5 blur-[80px]" />

      <div className="w-full max-w-md relative z-10 px-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <ShieldCheck className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white font-heading tracking-tight mb-2">
              Painel Administrativo
            </h1>
            {tenantName ? (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/5">
                <LayoutDashboard className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  {tenantName}
                </span>
              </div>
            ) : (
              <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Usuário
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nome.sobrenome"
                disabled={loading || !tenantId}
                required
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading || !tenantId}
                required
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl focus:ring-primary/50 transition-all placeholder:text-slate-600"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !tenantId}
              className="w-full h-12 rounded-xl font-bold text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Autenticando...</span>
                </div>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>

            {!tenantId && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-[10px] text-amber-200 font-medium text-center leading-relaxed">
                  Aguardando identificação da loja pelo subdomínio. Se persistir, verifique sua conexão.
                </p>
              </div>
            )}
          </form>

          <p className="mt-8 text-center text-slate-500 text-[10px] font-medium uppercase tracking-widest">
            Powered by TCG Shop SaaS · &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
