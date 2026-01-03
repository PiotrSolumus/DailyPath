import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Building2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";

interface Department {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  manager?: {
    id: string;
    full_name: string;
  };
}

async function fetchDepartments(): Promise<Department[]> {
  // Mock data - will be replaced with actual API call
  return [
    {
      id: "1",
      name: "IT",
      description: "Dział informatyczny",
      member_count: 15,
      manager: { id: "2", full_name: "Jan Kowalski" },
    },
    {
      id: "2",
      name: "HR",
      description: "Dział zasobów ludzkich",
      member_count: 5,
      manager: { id: "3", full_name: "Anna Nowak" },
    },
    {
      id: "3",
      name: "Sprzedaż",
      description: "Dział sprzedaży",
      member_count: 20,
    },
  ];
}

export function DepartmentsManagement() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: departments, isLoading } = useQuery({
    queryKey: ["admin-departments"],
    queryFn: fetchDepartments,
  });

  const filteredDepartments = departments?.filter((dept) =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Działy</CardTitle>
            <CardDescription>Zarządzaj strukturą organizacyjną firmy</CardDescription>
          </div>
          <Button>
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
                        {dept.description && (
                          <CardDescription className="text-xs">{dept.description}</CardDescription>
                        )}
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
                    <Button variant="outline" size="sm" className="flex-1">
                      Edytuj
                    </Button>
                    <Button variant="ghost" size="sm">
                      Usuń
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
  );
}

