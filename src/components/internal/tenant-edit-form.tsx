"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { feedback } from "@/lib/utils/feedback";
import type { Tenant } from "@/lib/domain/entities/tenant";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface Props {
  tenant: Tenant;
}

export function TenantEditForm({ tenant }: Props) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name);
  const [email, setEmail] = useState(tenant.email ?? "");
  const [phone, setPhone] = useState(tenant.phone ?? "");
  const [description, setDescription] = useState(tenant.description ?? "");
  const [savingDetails, setSavingDetails] = useState(false);
  const [active, setActive] = useState(tenant.active);
  const [togglePending, setTogglePending] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [, startTransition] = useTransition();

  const persist = async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/internal/tenants/${tenant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      const detail = Array.isArray(json.error?.details)
        ? json.error.details.join("\n")
        : undefined;
      throw new Error(detail || json.message || "Falha ao atualizar tenant");
    }
    return json.data as Tenant;
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    try {
      await persist({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        description: description.trim(),
      });
      feedback.success("Tenant atualizado");
      startTransition(() => router.refresh());
    } catch (err) {
      feedback.apiError(err);
    } finally {
      setSavingDetails(false);
    }
  };

  const performToggle = async () => {
    setTogglePending(true);
    try {
      const next = !active;
      await persist({ active: next });
      setActive(next);
      feedback.success(next ? "Tenant ativado" : "Tenant desativado");
      startTransition(() => router.refresh());
    } catch (err) {
      feedback.apiError(err);
    } finally {
      setTogglePending(false);
      setDeactivateConfirmOpen(false);
    }
  };

  const handleToggle = () => {
    if (active) {
      setDeactivateConfirmOpen(true);
    } else {
      void performToggle();
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSaveDetails} className="grid gap-6">
        <div className="grid gap-2">
          <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Nome
          </label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl"
            required
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
              Telefone
            </label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
            Descrição
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={savingDetails}
            className="rounded-xl h-11 px-6 shadow-lg shadow-primary/10"
          >
            {savingDetails && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </div>
      </form>

      <div className="border-t border-border/30 pt-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-bold tracking-tight text-foreground">
              {active ? "Tenant ativo" : "Tenant inativo"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              {active
                ? "Desativar bloqueia o acesso ao painel administrativo e à loja deste tenant."
                : "Reativar restaura o acesso ao painel administrativo e à loja."}
            </p>
          </div>
          <Button
            type="button"
            onClick={handleToggle}
            disabled={togglePending}
            variant={active ? "destructive" : "default"}
            className="rounded-xl h-10 gap-2"
          >
            {togglePending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            {active ? "Desativar tenant" : "Ativar tenant"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={deactivateConfirmOpen}
        onOpenChange={setDeactivateConfirmOpen}
        onConfirm={performToggle}
        title="Desativar tenant"
        description={`Tem certeza que deseja desativar "${tenant.name}"? Os usuários perderão acesso imediato.`}
        loading={togglePending}
      />
    </div>
  );
}
