import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Mail, Shield } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { getErrorMessage } from "@/lib/utils/error-messages";

interface User {
  id: string;
  email: string;
  full_name: string;
  app_role: "employee" | "manager" | "admin";
  is_active: boolean;
  timezone?: string;
  active_department?: {
    id: string;
    name: string;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

interface CreateUserData {
  email: string;
  full_name: string;
  password: string;
  app_role: "employee" | "manager" | "admin";
  timezone?: string;
}

async function fetchUsers(): Promise<User[]> {
  const response = await fetch("/api/admin/users", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy użytkowników");
  }

  return response.json();
}

async function createUser(data: CreateUserData): Promise<void> {
  const response = await fetch("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się utworzyć użytkownika");
  }
}

async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch("/api/departments", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy działów");
  }

  return response.json();
}

async function assignUserToDepartment({
  userId,
  departmentId,
}: {
  userId: string;
  departmentId: string;
}): Promise<void> {
  const response = await fetch("/api/admin/departments/assign-member", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ user_id: userId, department_id: departmentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się przypisać użytkownika");
  }
}

async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się usunąć użytkownika");
  }
}

export function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    full_name: "",
    password: "",
    app_role: "employee",
  });
  const [error, setError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const {
    data: users,
    isLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const { data: departments, isLoading: isDepartmentsLoading, error: departmentsError } = useQuery({
    queryKey: ["departments"],
    queryFn: fetchDepartments,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      // Refresh users list
      await queryClient.invalidateQueries({ 
        queryKey: ["admin-users"],
        refetchType: "all"
      });
      // Show success message
      toast.success("Użytkownik został utworzony pomyślnie");
      // Close dialog and reset form
      setIsDialogOpen(false);
      setFormData({
        email: "",
        full_name: "",
        password: "",
        app_role: "employee",
      });
      setError(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const assignUserMutation = useMutation({
    mutationFn: assignUserToDepartment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-users"], refetchType: "all" }),
        queryClient.invalidateQueries({ queryKey: ["admin-departments"], refetchType: "all" }),
      ]);
      toast.success("Użytkownik został przypisany do działu");
      setIsAssignDialogOpen(false);
      setSelectedUser(null);
      setSelectedDepartmentId("");
      setAssignError(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      setAssignError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"], refetchType: "all" });
      toast.success("Użytkownik został usunięty");
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createUserMutation.mutate(formData);
  };

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
    setError(null);
    setFormData({
      email: "",
      full_name: "",
      password: "",
      app_role: "employee",
    });
  };

  const handleOpenAssignDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedDepartmentId(user.active_department?.id ?? "");
    setAssignError(null);
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!selectedDepartmentId) {
      setAssignError("Wybierz dział");
      return;
    }
    setAssignError(null);
    assignUserMutation.mutate({ userId: selectedUser.id, departmentId: selectedDepartmentId });
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      case "employee":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "employee":
        return "Pracownik";
      default:
        return role;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Użytkownicy</CardTitle>
              <CardDescription>Zarządzaj użytkownikami i ich rolami w systemie</CardDescription>
            </div>
            <Button type="button" onClick={handleOpenDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Dodaj użytkownika
            </Button>
          </div>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj użytkownika..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : usersError ? (
          <div className="rounded-lg border bg-destructive/5 p-6">
            <p className="text-sm text-destructive">
              Nie udało się pobrać użytkowników: {getErrorMessage(usersError)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Jeśli widzisz to jako admin, sprawdź czy jesteś zalogowany i czy API <code>/api/admin/users</code>{" "}
              zwraca 200.
            </p>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <span className="text-sm font-medium">{user.full_name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.full_name}</span>
                      <Badge variant={getRoleColor(user.app_role)}>{getRoleLabel(user.app_role)}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </span>
                      {user.active_department && (
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {user.active_department.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenAssignDialog(user)}>
                    Przypisz dział
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setUserToDelete(user)} disabled={deleteUserMutation.isPending}>
                    Usuń
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted p-12 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? "Nie znaleziono użytkowników" : "Brak użytkowników w systemie"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Add User Dialog */}
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
          <DialogDescription>
            Wypełnij poniższe pola, aby utworzyć nowe konto użytkownika w systemie.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Imię i nazwisko</Label>
              <Input
                id="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Jan Kowalski"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jan.kowalski@example.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={10}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••"
              />
              <p className="text-xs text-muted-foreground">Minimum 10 znaków</p>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="app_role">Rola</Label>
              <Select
                id="app_role"
                required
                value={formData.app_role}
                onChange={(e) =>
                  setFormData({ ...formData, app_role: e.target.value as "employee" | "manager" | "admin" })
                }
              >
                <option value="employee">Pracownik</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Tworzenie...
                </>
              ) : (
                "Dodaj użytkownika"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Assign Department Dialog */}
    <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przypisz dział</DialogTitle>
          <DialogDescription>
            Wybierz dział, do którego ma należeć użytkownik {selectedUser?.full_name}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAssignSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department">Dział</Label>
              <Select
                id="department"
                required
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                disabled={isDepartmentsLoading || !!departmentsError}
              >
                <option value="">Wybierz dział</option>
                {departments?.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
              {departmentsError && (
                <p className="text-sm text-destructive">Nie udało się załadować listy działów</p>
              )}
            </div>

            {assignError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{assignError}</div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={assignUserMutation.isPending}>
              {assignUserMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Zapisywanie...
                </>
              ) : (
                "Zapisz"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Delete User Confirm Dialog */}
    <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń użytkownika</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć użytkownika {userToDelete?.full_name}? Użytkownik zostanie zdezaktywowany,
            a jego członkostwa zostaną zamknięte.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setUserToDelete(null)}>
            Anuluj
          </Button>
          <Button
            variant="destructive"
            onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
            disabled={deleteUserMutation.isPending}
          >
            {deleteUserMutation.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Usuwanie...
              </>
            ) : (
              "Usuń"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}

