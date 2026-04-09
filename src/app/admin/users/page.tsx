"use client";

import { useState, useEffect } from "react";
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTableState } from "@/lib/hooks/use-table-state";
import { FilterSection } from "@/components/admin/filter-section";
import { TableSearch } from "@/components/admin/table-search";

interface User {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  createdAt: string;
}

export default function UsersPage() {
  const {
    search,
    setSearch,
    isPending,
  } = useTableState();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "USER">("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      
      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success("Usuário criado com sucesso");
      setIsCreateDialogOpen(false);
      setNewUsername("");
      setNewPassword("");
      setNewRole("USER");
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }

      toast.success("Usuário excluído com sucesso");
      fetchUsers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(message);
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
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie um novo usuário para acessar o painel administrativo.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="username" className="text-sm font-medium">Usuário</label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Nome de usuário"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-medium">Senha</label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="********"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="role" className="text-sm font-medium">Nível de Acesso</label>
                    <Select
                      value={newRole}
                      onValueChange={(value) => setNewRole(value as "ADMIN" | "USER")}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione o nível">
                          {newRole === "ADMIN" ? "Administrador" : "Usuário Comum"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Usuário Comum</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <FilterSection resultsCount={users.length}>
        <TableSearch
          value={search}
          onChange={setSearch}
          placeholder="Buscar por usuário..."
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
                  <TableHead>Usuário</TableHead>
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
                            {user.username.substring(0, 2)}
                          </div>
                          <span className="font-medium text-foreground">{user.username}</span>
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
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => handleDeleteUser(user.id, user.username)}
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
      </div>
    </div>
  );
}
