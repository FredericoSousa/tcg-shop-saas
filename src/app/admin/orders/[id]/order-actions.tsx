"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import { PaymentDialog } from "@/components/admin/orders/payment-dialog";
import { useRouter } from "next/navigation";

interface OrderActionsProps {
  orderId: string;
  customerId: string;
  totalAmount: number;
  status: string;
  friendlyId?: string | null;
}

export function OrderActions({ orderId, customerId, totalAmount, status, friendlyId }: OrderActionsProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const router = useRouter();

  if (status !== "PENDING") return null;

  return (
    <>
      <Button 
        onClick={() => setIsPaymentOpen(true)}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
      >
        <CreditCard className="w-4 h-4 mr-2" />
        Finalizar Pedido
      </Button>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        orderId={orderId}
        customerId={customerId}
        totalAmount={totalAmount}
        friendlyId={friendlyId}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
