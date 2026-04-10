import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin
} from "lucide-react";

interface TenantFooterProps {
  tenant: {
    name: string;
    description?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    twitter?: string | null;
    whatsapp?: string | null;
  } | null;
}

export function Footer({ tenant }: TenantFooterProps) {
  const currentYear = new Date().getFullYear();

  interface SocialLink {
    label: string;
    href: string | null | undefined;
    icon: (className: string) => React.ReactNode;
  }

  const socialLinks: SocialLink[] = [
    {
      label: "Instagram",
      href: tenant?.instagram,
      icon: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      )
    },
    {
      label: "Facebook",
      href: tenant?.facebook,
      icon: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
        </svg>
      )
    },
    {
      label: "Twitter",
      href: tenant?.twitter,
      icon: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
        </svg>
      )
    },
    {
      label: "WhatsApp",
      href: tenant?.whatsapp,
      icon: (className: string) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      )
    },
  ].filter(link => link.href);

  return (
    <footer className="bg-zinc-950 text-zinc-400 border-t border-zinc-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">{tenant?.name || "TCG Shop"}</h3>
            <p className="text-sm leading-relaxed">
              {tenant?.description || "Sua loja especializada em Trading Card Games. Qualidade, confiança e os melhores preços do mercado."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Links Rápidos</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-zinc-400 hover:text-white transition-colors font-medium">Início</Link>
              </li>
              <li>
                <Link href="/singles" className="text-zinc-400 hover:text-white transition-colors font-medium">Singles</Link>
              </li>
            </ul>
          </div>

          {/* Social Media Section */}
          <div className="space-y-6">
            <h3 className="text-white font-bold text-lg">Redes Sociais</h3>
            {socialLinks.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {socialLinks.map((social, idx) => (
                  <li key={idx}>
                    <a
                      href={social.href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group font-medium"
                    >
                      <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                        {social.icon("h-4 w-4")}
                      </div>
                      <span>{social.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 italic text-sm font-medium">Siga-nos em nossas redes.</p>
            )}
          </div>

          {/* Contact Section */}
          <div className="space-y-6 text-sm">
            <h3 className="text-white font-bold text-lg">Contato</h3>
            <div className="space-y-4">
              {tenant?.email && (
                <div className="flex items-start gap-3 text-zinc-400 hover:text-white transition-colors cursor-default group font-medium text-sm">
                  <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <Mail className="h-4 w-4 shrink-0 transition-colors" />
                  </div>
                  <span className="mt-1.5">{tenant.email}</span>
                </div>
              )}
              {tenant?.phone && (
                <div className="flex items-start gap-3 text-zinc-400 hover:text-white transition-colors cursor-default group font-medium text-sm">
                  <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <Phone className="h-4 w-4 shrink-0 transition-colors" />
                  </div>
                  <span className="mt-1.5">{tenant.phone}</span>
                </div>
              )}
              {tenant?.address && (
                <div className="flex items-start gap-3 text-zinc-400 hover:text-white transition-colors cursor-default group font-medium text-sm">
                  <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <MapPin className="h-4 w-4 shrink-0 transition-colors" />
                  </div>
                  <span className="mt-1.5 leading-tight">{tenant.address}</span>
                </div>
              )}
              {!tenant?.email && !tenant?.phone && !tenant?.address && (
                <p className="text-zinc-500 italic">Informações de contato não disponíveis.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium uppercase tracking-widest text-zinc-600">
          <p>© {currentYear} {tenant?.name}. Todos os direitos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Powered by TCG Shop SaaS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
