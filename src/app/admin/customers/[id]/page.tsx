import "reflect-metadata";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User as UserIcon,
  Users
} from "lucide-react";
import Link from "next/link";
import { container } from "@/lib/infrastructure/container";
import { GetCustomerUseCase } from "@/lib/application/use-cases/get-customer.use-case";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatPhone, formatCurrency } from "@/lib/utils";
import { CustomerOrdersTable } from "@/components/admin/customer-orders-table";
import { CustomerCreditSection } from "@/components/admin/customer-credit-section";
import { PageHeader } from "@/components/admin/page-header";

export default async function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const getCustomer = container.resolve(GetCustomerUseCase);
  const result = await getCustomer.execute(id);

  if (!result) {
    notFound();
  }

  const { customer, stats } = result;
  const { totalSpent, totalOrders } = stats;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <Link
        href="/admin/customers"
        className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-foreground w-fit transition-colors px-1"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Voltar para Clientes
      </Link>

      <PageHeader
        title={customer.name}
        description="Visualize o histórico de compras e informações do cliente"
        icon={Users}
        actions={
          <div className="flex items-center gap-3 bg-card/40 p-2 rounded-xl border border-zinc-200/50 backdrop-blur-md px-4 shadow-sm">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest leading-none mb-1">Pedidos</span>
              <span className="text-xl font-black text-primary leading-none">{totalOrders}</span>
            </div>
            <div className="h-8 w-px bg-zinc-200/50 mx-2" />
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mb-1">Ticket Médio</span>
              <span className="text-xl font-black text-primary leading-none">
                {formatCurrency(totalOrders > 0 ? totalSpent / totalOrders : 0)}
              </span>
            </div>
            <div className="h-8 w-px bg-zinc-200/50 mx-2" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none mb-1">LTV Total</span>
              <span className="text-xl font-black text-primary leading-none">
                {formatCurrency(totalSpent)}
              </span>
            </div>

          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Profile Card */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="bg-card/40 rounded-2xl border border-zinc-200/50 shadow-sm overflow-hidden backdrop-blur-md transition-all duration-300 hover:shadow-lg">
            <div className="bg-primary/5 p-6 border-b flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <UserIcon className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{customer.name}</h1>
              <StatusBadge status={customer.deletedAt ? "INACTIVE" : "ACTIVE"} />
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Email</span>
                  <span className="font-medium">{customer.email || "Não informado"}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Telefone</span>
                  <span className="font-medium">{formatPhone(customer.phoneNumber)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs uppercase font-bold tracking-wider">Cliente desde</span>
                  <span className="font-medium">{new Date(customer.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </div>

            <div className="bg-muted/30 p-6 border-t grid grid-cols-2 gap-4">
              <div className="flex flex-col text-center">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Pedidos</span>
                <span className="text-xl font-black text-primary">{totalOrders}</span>
              </div>
              <div className="flex flex-col text-center">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Gasto</span>
                <span className="text-xl font-black text-primary">
                  {formatCurrency(totalSpent)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table & Credits */}
        <div className="flex-1 flex flex-col gap-6">
          <CustomerOrdersTable customerId={id} />
          <CustomerCreditSection customerId={id} initialBalance={customer.creditBalance} />
        </div>
      </div>
    </div>
  );
}
