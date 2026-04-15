"use client";

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { cn } from "@/lib/utils";
import { feedback } from "@/lib/utils/feedback";
import { Loader2 } from "lucide-react";

export const customerSchema = z.object({
  phoneNumber: z.string().min(8, 'Telefone inválido'),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  form: UseFormReturn<any>;
  disabled?: boolean;
}

export function CustomerForm({ form, disabled }: CustomerFormProps) {
  const [customerExists, setCustomerExists] = useState<boolean | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const phoneNumber = form.watch('phoneNumber');
  const { errors } = form.formState;

  const handlePhoneBlur = async () => {
    const cleanPhone = phoneNumber?.replace(/\D/g, '') || "";
    if (cleanPhone.length < 8) {
      setCustomerExists(null);
      return;
    }

    setIsCheckingPhone(true);
    try {
      const response = await fetch(`/api/customers/${cleanPhone}`);
      const res = await response.json();
      const exists = res.data?.exists;
      setCustomerExists(exists);
      
      if (exists) {
        // Satisfy validation for known customer
        form.setValue('name', 'CLIENTE_EXISTENTE'); 
        form.clearErrors('name');
        feedback.success(`Bem-vindo de volta!`);
      } else if (form.getValues('name') === 'CLIENTE_EXISTENTE') {
        form.setValue('name', '');
      }
    } catch (error) {
      console.error('Error fetching customer', error);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleReset = () => {
    setCustomerExists(null);
    form.setValue('phoneNumber', '');
    form.setValue('name', '');
  };

  return (
    <div className="space-y-3 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden transition-all duration-500">
      <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 text-center opacity-70">
        Identificação do Cliente
      </h4>

      <div className="space-y-3">
        <div className="space-y-1 relative">
          <MaskedInput
            id="phoneNumber"
            mask="phone"
            placeholder="Telefone/WhatsApp *"
            {...form.register("phoneNumber")}
            onValueChange={(val) => {
              form.setValue('phoneNumber', String(val));
              if (customerExists !== null) {
                setCustomerExists(null);
              }
            }}
            onBlur={handlePhoneBlur}
            disabled={disabled || isCheckingPhone}
            className={cn(
              "h-10 text-sm rounded-xl transition-all focus:ring-primary bg-white border-zinc-200",
              errors.phoneNumber && "border-destructive focus:ring-destructive"
            )}
          />
          {isCheckingPhone && (
            <div className="absolute right-3 top-2.5">
              <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
            </div>
          )}
          {errors.phoneNumber && (
            <span className="text-[10px] text-destructive font-bold pl-1">
              {errors.phoneNumber.message as string}
            </span>
          )}
        </div>

        {customerExists ? (
          <div className="flex items-center justify-between bg-primary/5 p-3 rounded-xl border border-primary/10 animate-in fade-in slide-in-from-top-1 duration-300">
            <div className="flex flex-col">
              <span className="text-[10px] text-primary/60 font-bold uppercase tracking-tight">Status</span>
              <span className="text-sm font-black text-primary truncate max-w-[220px]">Cliente Reconhecido</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] font-bold text-destructive hover:underline px-2 py-1"
            >
              Trocar
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1">
              <Input
                id="name"
                placeholder="Nome completo *"
                {...form.register("name")}
                disabled={disabled || isCheckingPhone}
                className={cn(
                  "h-10 text-sm rounded-xl transition-all focus:ring-primary bg-white border-zinc-200",
                  errors.name && "border-destructive focus:ring-destructive"
                )}
              />
              {errors.name && (
                <span className="text-[10px] text-destructive font-bold pl-1">
                  {errors.name.message as string}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <input type="hidden" value={customerExists ? "true" : "false"} name="customerExists" />
    </div>
  );
}
