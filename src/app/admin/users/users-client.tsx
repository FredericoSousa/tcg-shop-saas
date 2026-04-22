"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Loader2, UserCog } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ModalLayout } from "@/components/ui/modal-layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { feedback } from "@/lib/utils/feedback";
import { useTableState } from "@/lib/hooks/use-table-state";
import { FilterSection } from "@/components/admin/filter-section";
import { TableSearch } from "@/components/admin/table-search";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { UserService } from "@/lib/api/services/user.service";
import { ConfirmModal } from "@/components/admin/confirm-modal";
import { passwordSchema } from "@/lib/validation/schemas";
import { PasswordStrength } from "@/components/ui/password-strength";

interface User {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string | Date;
}

interface UsersClientProps {
  initialUsers: User[];
  initialTotal: number;
  initialPageCount: number;
}

export function UsersClient({
  initialUsers,
  initialTotal,
  initialPageCount
}: UsersClientProps) {
  const {
    page,
    limit,
    search,
    setPage,
    setLimit,
    setSearch,
    isPending,
  } = useTableState();

  const [users, setUsers] = useState<User[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [pageCount, setPageCount] = useState(initialPageCount);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "USER">("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, email: string} | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await UserService.list({ page, limit, search });
      if (result.success && result.data) {
        setUsers(result.data.items || []);
        setTotal(result.data.total || 0);
        setPageCount(result.data.pageCount || 1);
      } else if (Array.isArray(result)) {
        // Fallback for legacy response format if needed
        setUsers(result);
      }
    } catch (error) {
      console.error(error);
      feedback.apiError(error, "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword) {
      feedback.error("Preencha todos os campos");
      return;
    }

    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      feedback.error(
        "Senha inválida",
        passwordResult.error.issues.map((i) => i.message).join("\n"),
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await UserService.create({
        email: newEmail,
        password: newPassword,
        role: newRole,
      });

      feedback.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("USER");
      fetchUsers();
    } catch (error) {
      feedback.apiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await UserService.delete(userToDelete.id);

      feedback.success("Usuário excluído com sucesso");
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      feedback.apiError(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      <PageHeader
        title="Gestão de Usuários"
        description="Gerencie quem tem acesso ao seu painel administrativo"
        icon={UserCog}
        actions={
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger
              render={
                <Button className="bg-primary hover:bg-primary/90 shadow-sm transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                </Button>
              }
            />
            <ModalLayout
              title="Adicionar Novo Usuário"
              description="Crie um novo usuário para acessar o painel administrativo."
              containerClassName="sm:max-w-[425px]"
              footer={
                <div className="flex justify-end gap-3 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="font-bold rounded-xl h-11"
                    type="button"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    form="user-form"
                    disabled={isSubmitting}
                    className="font-bold rounded-xl h-11 px-6 shadow-lg shadow-primary/10"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Usuário
                  </Button>
                </div>
              }
            >
              <form id="user-form" onSubmit={handleCreateUser} className="grid gap-6 py-4">
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                  <Input
                    id="email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Senha</label>
                  <Input
                    id="password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="********"
                    className="h-11 rounded-xl"
                    required
                  />
                  <PasswordStrength value={newPassword} className="mt-1" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nível de Acesso</label>
                  <Select
                    value={newRole}
                    onValueChange={(value) => setNewRole(value as "ADMIN" | "USER")}
                  >
                    <SelectTrigger id="role" className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione o nível">
                        {newRole === "ADMIN" ? "Administrador" : "Usuário Comum"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="USER">Usuário Comum</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </ModalLayout>
          </Dialog>
        }
      />

      <FilterSection resultsCount={users.length}>
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por email..."
          isLoading={loading || isPending}
        />
      </FilterSection>

      <div className="rounded-xl border bg-card/40 shadow-sm backdrop-blur-sm overflow-hidden p-0">
        <div className="p-0">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum usuário encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <StatusBadge status="ACTIVE" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                            {user.email.substring(0, 2)}
                          </div>
                          <span className="font-medium text-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.role} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive-muted"
                          onClick={() => setUserToDelete({ id: user.id, email: user.email })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
        {!loading && (
          <DataTablePagination
            page={page}
            pageCount={pageCount}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={setLimit}
          />
        )}
      </div>

      <ConfirmModal
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Excluir Usuário"
        description={`Tem certeza que deseja excluir o usuário ${userToDelete?.email}?`}
        loading={isDeleting}
      />
    </div>
  );
}
