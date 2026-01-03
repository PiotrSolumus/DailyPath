import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Mail, Shield } from "lucide-react";
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

interface User {
  id: string;
  email: string;
  full_name: string;
  app_role: "employee" | "manager" | "admin";
  is_active: boolean;
  active_department?: {
    id: string;
    name: string;
  } | null;
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

export function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: "",
    full_name: "",
    password: "",
    app_role: "employee",
  });
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // Refresh users list
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
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
      setError(error.message);
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
            <Button onClick={handleOpenDialog}>
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
                  <Button variant="outline" size="sm">
                    Edytuj
                  </Button>
                  <Button variant="ghost" size="sm">
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
  </>
  );
}

