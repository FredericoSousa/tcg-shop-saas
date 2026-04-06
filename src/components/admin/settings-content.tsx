"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Settings, 
  Palette, 
  Globe, 
  MessageSquare, 
  Layout, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Send,
  Save,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TenantSettings {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  whatsapp: string | null;
  facebook: string | null;
  twitter: string | null;
}

export function SettingsContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<TenantSettings>({
    name: "",
    logoUrl: "",
    faviconUrl: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    instagram: "",
    whatsapp: "",
    facebook: "",
    twitter: "",
  });

  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch("/api/admin/settings");
        if (!response.ok) throw new Error("Falha ao carregar configurações");
        const data = await response.json();
        setSettings({
          name: data.name || "",
          logoUrl: data.logoUrl || "",
          faviconUrl: data.faviconUrl || "",
          description: data.description || "",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          instagram: data.instagram || "",
          whatsapp: data.whatsapp || "",
          facebook: data.facebook || "",
          twitter: data.twitter || "",
        });
      } catch (error) {
        toast.error("Erro ao carregar configurações");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Falha ao salvar");
      
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const formatPhone = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length <= 10) {
      return value
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return value
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      setSettings(prev => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tabs = [
    { id: "general", label: "Geral", icon: Settings },
    { id: "appearance", label: "Aparência", icon: Palette },
    { id: "contact", label: "Contato", icon: Mail },
    { id: "social", label: "Redes Sociais", icon: Globe },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Tabs */}
      <div className="space-y-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? "bg-primary text-white shadow-md dark:text-zinc-950" 
                : "text-muted-foreground dark:text-zinc-400 hover:bg-muted dark:hover:bg-zinc-800/50 hover:text-foreground dark:hover:text-zinc-100"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="md:col-span-3">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6 transition-all duration-300">
            {activeTab === "general" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Nome da Loja</label>
                  <Input 
                    name="name" 
                    value={settings.name} 
                    onChange={handleChange} 
                    placeholder="Ex: Minha Loja TCG"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Descrição (SEO)</label>
                  <Textarea 
                    name="description" 
                    value={settings.description || ""} 
                    onChange={handleChange} 
                    placeholder="Uma breve descrição da sua loja para aparecer nos buscadores."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">URL do Logo</label>
                  <Input 
                    name="logoUrl" 
                    value={settings.logoUrl || ""} 
                    onChange={handleChange} 
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">URL do Favicon</label>
                  <Input 
                    name="faviconUrl" 
                    value={settings.faviconUrl || ""} 
                    onChange={handleChange} 
                    placeholder="https://exemplo.com/favicon.ico"
                  />
                </div>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> Email de Contato
                  </label>
                  <Input 
                    name="email" 
                    type="email"
                    value={settings.email || ""} 
                    onChange={handleChange} 
                    placeholder="contato@loja.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefone/WhatsApp
                  </label>
                  <Input 
                    name="phone" 
                    value={settings.phone || ""} 
                    onChange={handleChange} 
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Endereço Físico
                  </label>
                  <Input 
                    name="address" 
                    value={settings.address || ""} 
                    onChange={handleChange} 
                    placeholder="Rua Exemplo, 123 - São Paulo, SP"
                  />
                </div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Instagram (URL ou @)
                  </label>
                  <Input 
                    name="instagram" 
                    value={settings.instagram || ""} 
                    onChange={handleChange} 
                    placeholder="https://instagram.com/sualoja"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> Facebook URL
                  </label>
                  <Input 
                    name="facebook" 
                    value={settings.facebook || ""} 
                    onChange={handleChange} 
                    placeholder="https://facebook.com/sualoja"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Send className="h-4 w-4" /> Twitter URL
                  </label>
                  <Input 
                    name="twitter" 
                    value={settings.twitter || ""} 
                    onChange={handleChange} 
                    placeholder="https://twitter.com/sualoja"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" /> WhatsApp URL (direct)
                  </label>
                  <Input 
                    name="whatsapp" 
                    value={settings.whatsapp || ""} 
                    onChange={handleChange} 
                    placeholder="https://wa.me/5511999999999"
                  />
                </div>
              </div>
            )}

            <div className="pt-4 border-t flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
