import { Download, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { useReportFilters } from "../../lib/utils/query-params";

interface DepartmentOption {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  full_name: string | null;
  email: string;
}

async function fetchDepartments(): Promise<DepartmentOption[]> {
  const res = await fetch("/api/departments");
  if (!res.ok) {
    throw new Error("Nie udało się pobrać działów");
  }
  return res.json();
}

async function fetchUsers(): Promise<UserOption[]> {
  const res = await fetch("/api/users");
  if (!res.ok) {
    throw new Error("Nie udało się pobrać użytkowników");
  }
  return res.json();
}

interface ReportFiltersProps {
  onExport: () => void;
  isExporting?: boolean;
}

export function ReportFilters({ onExport, isExporting }: ReportFiltersProps) {
  const { filters, setStartDate, setEndDate, setDepartmentId, setUserId, clearFilters } = useReportFilters();
  const { data: departments, isLoading: depsLoading } = useQuery({
    queryKey: ["report-departments"],
    queryFn: fetchDepartments,
  });
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["report-users"],
    queryFn: fetchUsers,
  });

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Filtry raportu</h3>
          <div className="flex gap-2">
            {Object.values(filters).some((v) => v !== undefined) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Wyczyść
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onExport} disabled={isExporting}>
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? "Eksportowanie..." : "Eksport CSV"}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date range */}
          <div className="space-y-2">
            <Label htmlFor="start-date">Data od</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.start_date ?? ""}
              onChange={(e) => setStartDate(e.target.value || null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">Data do</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.end_date ?? ""}
              onChange={(e) => setEndDate(e.target.value || null)}
            />
          </div>

          {/* Department - placeholder */}
          <div className="space-y-2">
            <Label htmlFor="department-filter">Dział</Label>
            <Select
              id="department-filter"
              value={filters.department_id ?? ""}
              onChange={(e) => setDepartmentId(e.target.value || null)}
            >
              <option value="">Wszystkie</option>
              {depsLoading && <option value="">Ładowanie...</option>}
              {departments?.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </div>

          {/* User - placeholder */}
          <div className="space-y-2">
            <Label htmlFor="user-filter">Użytkownik</Label>
            <Select
              id="user-filter"
              value={filters.user_id ?? ""}
              onChange={(e) => setUserId(e.target.value || null)}
            >
              <option value="">Wszyscy</option>
              {usersLoading && <option value="">Ładowanie...</option>}
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>
  );
}

