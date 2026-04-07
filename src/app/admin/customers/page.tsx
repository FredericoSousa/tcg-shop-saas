"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  User as UserIcon, 
  Loader2, 
  Search, 
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  deletedAt: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced search
  const debouncedSearch = useDebounce(searchTerm, 500);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        search: debouncedSearch,
        includeDeleted: includeDeleted.toString(),
      });
      const response = await fetch(`/api/admin/customers?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.items);
      setTotalPages(data.pageCount);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, includeDeleted]);

  useEffect(() => {
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
      const url = editingCustomer 
        ? `/api/admin/customers/${editingCustomer.id}` 
        : "/api/admin/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save customer");
      }

      toast.success(editingCustomer ? "Cliente atualizado" : "Cliente criado");
      setIsDialogOpen(false);
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir o cliente ${name}?`)) return;

    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete customer");

      toast.success("Cliente excluído com sucesso");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) throw new Error("Failed to restore customer");

      toast.success("Cliente restaurado com sucesso");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        title="Clientes"
        description="Gerencie o cadastro de clientes da sua loja"
        icon={Users}
        actions={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIncludeDeleted(!includeDeleted)}
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

      <div className="flex items-center gap-4 bg-card/40 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border/50 bg-card/40 shadow-sm backdrop-blur-sm">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum cliente encontrado.
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
                      {customer.phoneNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
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
                              onClick={(e) => handleDelete(customer.id, customer.name, e)}
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
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="flex items-center px-4 text-sm font-medium">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingCustomer ? "Editar Cliente" : "Adicionar Novo Cliente"}
              </DialogTitle>
              <DialogDescription>
                {editingCustomer 
                  ? "Atualize as informações do cliente abaixo." 
                  : "Preencha as informações para cadastrar um novo cliente."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Nome</label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email (Opcional)</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">Telefone</label>
                <Input
                  id="phone"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCustomer ? "Salvar Alterações" : "Criar Cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
