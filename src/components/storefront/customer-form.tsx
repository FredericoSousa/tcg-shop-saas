"use client";

import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { cn } from "@/lib/utils";
import { feedback } from "@/lib/utils/feedback";
import { Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export const customerSchema = z.object({
  phoneNumber: z.string().min(8, 'Telefone inválido'),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  form: UseFormReturn<CustomerFormValues>;
  disabled?: boolean;
}

export function CustomerForm({ form, disabled }: CustomerFormProps) {
  const phoneNumber = form.watch('phoneNumber');
  const cleanPhone = phoneNumber?.replace(/\D/g, '') || "";
  const { errors } = form.formState;

  const { data: customerLookup, isLoading: isCheckingPhone } = useQuery({
    queryKey: ['customer-lookup', cleanPhone],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${cleanPhone}`);
      const res = await response.json();
      return res.data;
    },
    enabled: cleanPhone.length >= 8,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const customerExists = !!customerLookup?.exists;

  // Sync name field when customer is found
  if (customerExists && form.getValues('name') === '') {
    form.setValue('name', 'CLIENTE_ID_' + customerLookup.id); 
    feedback.success(`Bem-vindo de volta!`);
  }

  const handleReset = () => {
    form.setValue('phoneNumber', '');
    form.setValue('name', '');
  };

  return (
    <div className="space-y-3 bg-white/40 backdrop-blur-sm p-5 rounded-3xl border border-zinc-200/50 shadow-xl shadow-zinc-200/20 relative overflow-hidden transition-all duration-500">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest opacity-70">
          Identificação do Cliente
        </h4>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />
      </div>

      <div className="space-y-4">
        <div className="space-y-1 relative">
          <MaskedInput
            id="phoneNumber"
            mask="phone"
            placeholder="Telefone/WhatsApp *"
            {...form.register("phoneNumber")}
            onValueChange={(val) => {
              form.setValue('phoneNumber', String(val));
            }}
            disabled={disabled || isCheckingPhone}
            className={cn(
              "h-12 text-base rounded-2xl transition-all border-zinc-200 shadow-sm focus:ring-2 focus:ring-primary/20",
              errors.phoneNumber && "border-destructive focus:ring-destructive/20"
            )}
          />
          {isCheckingPhone && (
            <div className="absolute right-4 top-3.5">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          {errors.phoneNumber && (
            <motion.span 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-destructive font-bold pl-2"
            >
              {errors.phoneNumber.message as string}
            </motion.span>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isCheckingPhone ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2 py-1"
            >
              <Skeleton className="h-14 w-full rounded-2xl" />
            </motion.div>
          ) : customerExists ? (
            <motion.div 
              key="exists"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/20 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <div className="flex flex-col relative z-10">
                <span className="text-[10px] text-primary font-black uppercase tracking-widest mb-0.5">Cliente Verificado</span>
                <span className="text-sm font-black text-zinc-900 truncate max-w-[200px]">Reconhecido pelo sistema</span>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-destructive hover:bg-destructive/5 px-4 py-2 rounded-xl transition-colors relative z-10"
              >
                Trocar
              </button>
            </motion.div>
          ) : cleanPhone.length >= 8 ? (
            <motion.div 
              key="new"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <Input
                  id="name"
                  placeholder="Nome completo *"
                  {...form.register("name")}
                  disabled={disabled}
                  className={cn(
                    "h-12 text-base rounded-2xl transition-all border-zinc-200 shadow-sm focus:ring-2 focus:ring-primary/20",
                    errors.name && "border-destructive focus:ring-destructive/20"
                  )}
                />
                {errors.name && (
                  <motion.span 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-destructive font-bold pl-2"
                  >
                    {errors.name.message as string}
                  </motion.span>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <input type="hidden" value={customerExists ? "true" : "false"} name="customerExists" />
    </div>
  );
}
