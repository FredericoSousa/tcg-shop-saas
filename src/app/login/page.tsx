import Link from "next/link";
import { Sparkles, Loader2 } from "lucide-react";
import { getTenant } from "@/lib/tenant-server";
import { LoginForm } from "./login-form";
import { Suspense } from "react";
import { container } from "@/lib/infrastructure/container";
import { GetTenantUseCase } from "@/lib/application/use-cases/tenant/get-tenant.use-case";
import { headers } from "next/headers";

export default function LoginPage() {
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

      {/* Right Column: Dynamic Login Form */}
      <Suspense fallback={
        <div className="flex flex-col justify-center items-center bg-white p-8 md:p-12 lg:p-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}

async function LoginContent() {
  let tenant = await getTenant();

  // Fallback: if proxy didn't set the header, try to get tenant by subdomain
  if (!tenant) {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    const subdomain = host.split(".")[0];
    
    if (subdomain && subdomain !== "localhost" && subdomain !== "www") {
      const getTenantUseCase = container.resolve(GetTenantUseCase);
      tenant = await getTenantUseCase.execute({ slug: subdomain });
    }
  }

  const tenantId = tenant?.id || "";
  const tenantName = tenant?.name || (tenantId ? "TCG Shop SaaS" : "Administração Interna");

  return (
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

        <LoginForm tenantId={tenantId} />

        {/* Footer Info */}
        <div className="mt-10 text-center space-y-6">
        </div>
      </div>
    </div>
  );
}
