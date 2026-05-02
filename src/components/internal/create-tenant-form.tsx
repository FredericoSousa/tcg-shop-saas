"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { feedback } from "@/lib/utils/feedback";

export function CreateTenantForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/internal/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          email: email.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        const detail = Array.isArray(json.error?.details)
          ? json.error.details.join("\n")
          : undefined;
        throw new Error(detail || json.message || "Falha ao criar tenant");
      }
      feedback.success("Tenant criado com sucesso");
      startTransition(() => {
        router.push(`/internal/tenants/${json.data.id}`);
        router.refresh();
      });
    } catch (err) {
      feedback.apiError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 max-w-xl">
      <div className="grid gap-2">
        <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
          Nome da loja
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slug) setSlug(slugify(e.target.value));
          }}
          placeholder="Loja do João"
          className="h-11 rounded-xl"
          required
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="slug" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
          Slug (subdomínio)
        </label>
        <Input
          id="slug"
          value={slug}
          onChange={(e) => setSlug(slugify(e.target.value))}
          placeholder="loja-do-joao"
          className="h-11 rounded-xl font-mono"
          required
        />
        <p className="text-xs text-muted-foreground ml-1">
          A loja ficará acessível em <span className="font-mono">{slug || "<slug>"}.&lt;dominio&gt;</span>
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
          Email de contato (opcional)
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="contato@loja.com"
          className="h-11 rounded-xl"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-xl h-11"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting || !slug || !name}
          className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10"
        >
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Tenant
        </Button>
      </div>
    </form>
  );
}
