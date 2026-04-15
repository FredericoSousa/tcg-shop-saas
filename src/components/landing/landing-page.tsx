'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ShoppingBag, 
  Users, 
  BarChart3, 
  ShieldCheck, 
  Zap, 
  Globe, 
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>A revolução na gestão de TCG</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9]">
              SUA LOJA DE CARDS <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                EM OUTRO NÍVEL.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
              A plataforma SaaS definitiva para lojistas de Trading Card Games. 
              Gerencie inventário, vendas e clientes com tecnologia de ponta.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link 
                href="/login" 
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-600/20 flex items-center gap-2"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-slate-900/50 hover:bg-slate-900 text-white font-bold rounded-2xl border border-slate-800 transition-all hover:border-slate-700">
                Ver Demonstração
              </button>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Preview Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="container mx-auto max-w-5xl mt-20 relative"
        >
          <div className="relative rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl p-4 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
            <div className="aspect-[16/9] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center relative">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
               <div className="grid grid-cols-12 gap-4 w-full h-full p-6">
                 <div className="col-span-3 space-y-4">
                   {[1, 2, 3, 4].map(i => (
                     <div key={i} className="h-8 bg-slate-900/50 rounded-lg w-full animate-pulse" />
                   ))}
                 </div>
                 <div className="col-span-9 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-900/50 rounded-xl animate-pulse" />
                      ))}
                    </div>
                    <div className="h-full bg-slate-900/50 rounded-xl animate-pulse" />
                 </div>
               </div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="px-6 py-3 bg-blue-600 rounded-full text-sm font-bold shadow-2xl">
                    Dashboard Administrativo
                 </div>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative bg-slate-950">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-blue-400 font-bold tracking-widest uppercase text-sm">Recursos Premium</h2>
            <p className="text-4xl md:text-5xl font-black text-white tracking-tight">Tudo o que você precisa <br /> em um só lugar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<ShoppingBag className="w-8 h-8" />}
              title="Gestão de Inventário"
              description="Controle total sobre seu estoque de singles e selados com integração Scryfall."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8" />}
              title="Vendas & POS"
              description="Terminal de ponto de venda fluido para sua loja física e integração online."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="CRM & Fidelidade"
              description="Conheça seus clientes, histórico de compras e gerencie créditos da loja."
            />
            <FeatureCard 
              icon={<Zap className="w-8 h-8" />}
              title="Automação"
              description="Scrapers integrados para manter seus preços sempre competitivos."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8" />}
              title="Segurança"
              description="Dados protegidos e infraestrutura escalável para sua tranquilidade."
            />
            <FeatureCard 
              icon={<Globe className="w-8 h-8" />}
              title="Multi-tenant"
              description="Sua loja em seu próprio subdomínio com identidade visual única."
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-32 relative bg-slate-900/20">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Criado por quem entende <br /> 
                de Trading Card Games.
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Nossa plataforma foi desenhada focando nas dores reais dos lojistas brasileiros. 
                Desde a precificação via LigaMagic até a gestão de créditos e encomendas.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-slate-300 font-medium text-lg">Interface ultrarrápida e intuitiva</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-slate-300 font-medium text-lg">Suporte a múltiplos TCGs</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-slate-300 font-medium text-lg">Relatórios financeiros detalhados</span>
                </li>
              </ul>
            </div>

            <div className="relative h-[400px] rounded-3xl overflow-hidden bg-slate-800/50 border border-slate-700/50 flex items-center justify-center group">
               <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50" />
               <motion.div 
                 whileHover={{ scale: 1.05, rotate: 2 }}
                 transition={{ type: "spring", stiffness: 300 }}
                 className="relative z-10 p-12 text-center"
               >
                 <Sparkles className="w-20 h-20 text-blue-500 mx-auto mb-6 opacity-80" />
                 <p className="text-2xl font-bold text-white italic">&quot;A melhor decisão que tomei para minha loja.&quot;</p>
                 <p className="mt-4 text-slate-500 uppercase tracking-widest text-xs font-bold font-mono">— Lojista Satisfeito</p>
               </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="relative rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-700 p-12 md:p-20 text-center overflow-hidden shadow-2xl shadow-blue-600/20">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-[80px]" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Pronto para escalar seu negócio?
              </h2>
              <p className="text-blue-100 text-xl max-w-lg mx-auto leading-relaxed opacity-90">
                Junte-se a dezenas de lojistas que já estão modernizando seu atendimento e vendas.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href="/login" 
                  className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl text-lg uppercase"
                >
                  Criar minha loja
                </Link>
                <button className="px-10 py-5 bg-blue-700 text-white font-black rounded-2xl transition-all hover:bg-blue-800 active:scale-95 text-lg uppercase border border-blue-500/50">
                  Falar com especialista
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900 bg-slate-950/50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">TCG Shop SaaS</span>
            </div>

            <div className="flex gap-8 text-slate-500 text-sm font-medium">
              <Link href="#" className="hover:text-white transition-colors">Termos</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookies</Link>
              <Link href="#" className="hover:text-white transition-colors">Contato</Link>
            </div>

            <p className="text-slate-600 text-sm">
              © 2026 TCG Shop SaaS. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/50 hover:border-blue-500/30 transition-all hover:bg-slate-900/60 group"
    >
      <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center mb-6 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner border border-slate-800 group-hover:border-blue-400">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-400 leading-relaxed font-light">{description}</p>
    </motion.div>
  );
}
