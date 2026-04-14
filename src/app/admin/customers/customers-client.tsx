"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Loader2,
  RefreshCcw,
  Edit2,
  Users,
  Eye,
  EyeOff
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
} from "@/components/ui/dialog";
import { ModalLayout } from "@/components/ui/modal-layout";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useTableState } from "@/lib/hooks/use-table-state";
import { FilterSection } from "@/components/admin/filter-section";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { TableSearch } from "@/components/admin/table-search";
import { CustomerService } from "@/lib/api/services/customer.service";
import { formatPhone } from "@/lib/utils";
import { MaskedInput } from "@/components/ui/masked-input";
import { ConfirmModal } from "@/components/admin/confirm-modal";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  deletedAt: Date | null;
  createdAt: Date | null;
}

interface CustomersClientProps {
  initialCustomers: Customer[];
  initialTotal: number;
  initialPageCount: number;
}

export function CustomersClient({
  initialCustomers,
  initialTotal,
  initialPageCount,
}: CustomersClientProps) {
  const router = useRouter();
  const {
    page,
    limit,
    search,
    getFilter,
    setPage,
    setLimit,
    setSearch,
    setFilter,
    isPending,
  } = useTableState();

  const includeDeleted = getFilter("includeDeleted") === "true";

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [total, setTotal] = useState(initialTotal);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [loading, setLoading] = useState(false);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string, name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await CustomerService.list({
        page,
        limit,
        search,
        includeDeleted,
      });
      if (result.success && result.data) {
        setCustomers(result.data.items || []);
        setTotal(result.data.total || 0);
        setPageCount(result.data.pageCount || 1);
      } else {
        throw new Error(result.message || "Failed to parse customers data");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, includeDeleted]);

  // Only fetch on change if we're not on the initial load state or if filters changed
  useEffect(() => {
    // Avoid re-fetching initial data if it's identical to current searchParams
    // But for simplicity, we let useTableState handle the URL synchronization
    // and we re-fetch when useTableState's values change.
    // To truely optimize, we could compare with initial props.
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phoneNumber: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phoneNumber: customer.phoneNumber,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phoneNumber) {
      toast.error("Nome e Telefone são obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await CustomerService.update(editingCustomer.id, formData);
      } else {
        await CustomerService.create(formData);
      }

      toast.success(editingCustomer ? "Cliente atualizado" : "Cliente criado");
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);

    try {
      await CustomerService.delete(customerToDelete.id);

      toast.success("Cliente excluído com sucesso");
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao excluir cliente";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await CustomerService.restore(id);

      toast.success("Cliente restaurado com sucesso");
      fetchCustomers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao restaurar cliente";
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Clientes"
        description="Gerencie o cadastro de clientes da sua loja"
        icon={Users}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter("includeDeleted", (!includeDeleted).toString())}
              className={includeDeleted ? "border-primary text-primary" : ""}
            >
              {includeDeleted ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
              {includeDeleted ? "Ocultar Excluídos" : "Ver Excluídos"}
            </Button>
            <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </div>
        }
      />

      <FilterSection resultsCount={total}>
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, email ou telefone..."
          isLoading={loading || isPending}
        />
      </FilterSection>

      <div className={`overflow-hidden rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm ${(loading || isPending) ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}`}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Cliente desde</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    "Nenhum cliente encontrado."
                  )}
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow
                  key={customer.id}
                  className="group hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
                >
                  <TableCell>
                    <StatusBadge status={customer.deletedAt ? "INACTIVE" : "ACTIVE"} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                        {customer.name.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {customer.name}
                        </span>
                        {customer.email && (
                          <span className="text-xs text-muted-foreground">{customer.email}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatPhone(customer.phoneNumber)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 text-right">
                      {customer.deletedAt ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          onClick={(e) => handleRestore(customer.id, e)}
                          title="Restaurar"
                        >
                          <RefreshCcw className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-primary"
                            onClick={(e) => handleOpenEdit(customer, e)}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-red-500"
                            onClick={(e) => { e.stopPropagation(); setCustomerToDelete({ id: customer.id, name: customer.name }); }}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <DataTablePagination
          page={page}
          pageCount={pageCount}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ModalLayout
          title={editingCustomer ? "Editar Cliente" : "Adicionar Novo Cliente"}
          description={
            editingCustomer
              ? "Atualize as informações do cliente abaixo."
              : "Preencha as informações para cadastrar um novo cliente."
          }
          containerClassName="sm:max-w-[425px]"
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="font-bold rounded-xl h-11"
                type="button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="customer-form"
                disabled={isSubmitting}
                className="font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/10"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCustomer ? "Salvar Alterações" : "Criar Cliente"}
              </Button>
            </div>
          }
        >
          <form id="customer-form" onSubmit={handleSubmit} className="grid gap-6 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome</label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email (Opcional)</label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Telefone</label>
              <MaskedInput
                id="phone"
                mask="phone"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="(00) 00000-0000"
                className="h-11 rounded-xl"
                required
              />
            </div>
          </form>
        </ModalLayout>
      </Dialog>

      <ConfirmModal
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
        onConfirm={handleDelete}
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente ${customerToDelete?.name}?`}
        loading={isDeleting}
      />
    </div>
  );
}
