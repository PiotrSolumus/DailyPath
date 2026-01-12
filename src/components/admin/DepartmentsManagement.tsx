import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Building2, Users, Pencil, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { getErrorMessage } from "@/lib/utils/error-messages";

interface Department {
  id: string;
  name: string;
  member_count: number;
  manager?: {
    id: string;
    full_name: string;
  } | null;
}

interface DepartmentFormData {
  name: string;
}

interface DepartmentMember {
  id: string;
  full_name: string;
  email: string;
}

async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch("/api/admin/departments", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Nie udało się pobrać listy działów");
  }

  return response.json();
}

async function createDepartment(data: DepartmentFormData): Promise<void> {
  const response = await fetch("/api/admin/departments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się utworzyć działu");
  }
}

async function updateDepartment(id: string, data: DepartmentFormData): Promise<void> {
  const response = await fetch(`/api/admin/departments/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się zaktualizować działu");
  }
}

async function fetchDepartmentMembers(departmentId: string): Promise<DepartmentMember[]> {
  const response = await fetch(`/api/admin/departments/${departmentId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się pobrać członków działu");
  }

  return response.json();
}

async function removeDepartmentMember({
  userId,
  departmentId,
}: {
  userId: string;
  departmentId: string;
}): Promise<void> {
  const response = await fetch(`/api/admin/departments/assign-member`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ user_id: userId, department_id: departmentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się usunąć członka z działu");
  }
}

async function deleteDepartment(id: string): Promise<void> {
  const response = await fetch(`/api/admin/departments/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Nie udało się usunąć działu");
  }
}

export function DepartmentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>({ name: "" });
  const [error, setError] = useState<string | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedDepartmentForMembers, setSelectedDepartmentForMembers] = useState<Department | null>(null);

  const queryClient = useQueryClient();

  const { data: departments, isLoading } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: fetchDepartments,
  });

  const {
    data: departmentMembers,
    isLoading: isMembersLoading,
    error: membersError,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["admin-department-members", selectedDepartmentForMembers?.id],
    queryFn: () => fetchDepartmentMembers(selectedDepartmentForMembers?.id || ""),
    enabled: !!selectedDepartmentForMembers,
  });

  const removeMemberMutation = useMutation({
    mutationFn: removeDepartmentMember,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-departments"], refetchType: "all" }),
        refetchMembers(),
      ]);
      toast.success("Członek został usunięty z działu");
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-departments"],
        refetchType: "all",
      });
      toast.success("Dział został utworzony pomyślnie");
      setIsCreateDialogOpen(false);
      setFormData({ name: "" });
      setError(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DepartmentFormData }) => updateDepartment(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-departments"],
        refetchType: "all",
      });
      toast.success("Dział został zaktualizowany pomyślnie");
      setIsEditDialogOpen(false);
      setSelectedDepartment(null);
      setFormData({ name: "" });
      setError(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      toast.error(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["admin-departments"],
        refetchType: "all",
      });
      toast.success("Dział został usunięty pomyślnie");
      setIsDeleteDialogOpen(false);
      setSelectedDepartment(null);
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;
    setError(null);
    updateMutation.mutate({ id: selectedDepartment.id, data: formData });
  };

  const handleDeleteConfirm = () => {
    if (!selectedDepartment) return;
    deleteMutation.mutate(selectedDepartment.id);
  };

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
    setError(null);
    setFormData({ name: "" });
  };

  const handleOpenEditDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setFormData({ name: dept.name });
    setError(null);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (dept: Department) => {
    setSelectedDepartment(dept);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenMembersDialog = (dept: Department) => {
    setSelectedDepartmentForMembers(dept);
    setIsMembersDialogOpen(true);
    // refetch handled by useQuery enabled; force refetch to avoid stale
    void refetchMembers();
  };

  const filteredDepartments = departments?.filter((dept) => dept.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Działy</CardTitle>
              <CardDescription>Zarządzaj strukturą organizacyjną firmy</CardDescription>
            </div>
            <Button onClick={handleOpenCreateDialog}>
              <Building2 className="mr-2 h-4 w-4" />
              Dodaj dział
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj działu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Departments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredDepartments && filteredDepartments.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDepartments.map((dept) => (
                <Card key={dept.id} className="hover:bg-accent transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{dept.name}</CardTitle>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Członkowie:</span>
                      <Badge variant="secondary">{dept.member_count}</Badge>
                    </div>
                    {dept.manager && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Manager: </span>
                        <span className="font-medium">{dept.manager.full_name}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEditDialog(dept)}>
                        <Pencil className="mr-2 h-3 w-3" />
                        Edytuj
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenMembersDialog(dept)}
                      >
                        <Users className="mr-2 h-3 w-3" />
                        Zobacz członków
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenDeleteDialog(dept)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-muted p-12 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "Nie znaleziono działów" : "Brak działów w systemie"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Department Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dodaj nowy dział</DialogTitle>
            <DialogDescription>Wypełnij poniższe pola, aby utworzyć nowy dział w systemie.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Nazwa działu</Label>
                <Input
                  id="create-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. IT, HR, Sprzedaż"
                />
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Tworzenie...
                  </>
                ) : (
                  "Dodaj dział"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj dział</DialogTitle>
            <DialogDescription>Zaktualizuj dane działu.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nazwa działu</Label>
                <Input
                  id="edit-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="np. IT, HR, Sprzedaż"
                />
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Zapisywanie...
                  </>
                ) : (
                  "Zapisz zmiany"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Department Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Usuń dział</DialogTitle>
            <DialogDescription>
              Czy na pewno chcesz usunąć dział "{selectedDepartment?.name}"? Ta operacja jest nieodwracalna.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Anuluj
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Usuwanie...
                </>
              ) : (
                "Usuń dział"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Członkowie działu</DialogTitle>
            <DialogDescription>
              {selectedDepartmentForMembers ? `Dział: ${selectedDepartmentForMembers.name}` : "Wybierz dział"}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-[120px] space-y-4">
            {isMembersLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size="lg" />
              </div>
            ) : membersError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                Nie udało się pobrać listy członków: {getErrorMessage(membersError)}
              </div>
            ) : departmentMembers && departmentMembers.length > 0 ? (
              <div className="space-y-3">
                {departmentMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                    <div>
                      <div className="font-medium">{member.full_name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeMemberMutation.mutate({
                            userId: member.id,
                            departmentId: selectedDepartmentForMembers?.id || "",
                          })
                        }
                        disabled={removeMemberMutation.isPending}
                      >
                        Usuń
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border bg-muted/60 p-4 text-sm text-muted-foreground">
                Brak aktywnych członków w tym dziale
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMembersDialogOpen(false)}>
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
