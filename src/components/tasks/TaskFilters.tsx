import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useTaskFilters } from "../../lib/utils/query-params";

export function TaskFilters() {
  const { filters, setStatus, setPriority, setDepartmentId, setUserId, setIsPrivate, clearFilters } =
    useTaskFilters();

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Filtry</h3>
          {Object.values(filters).some((v) => v !== undefined) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Wyczyść
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              id="status-filter"
              value={filters.status ?? ""}
              onChange={(e) => setStatus(e.target.value || null)}
            >
              <option value="">Wszystkie</option>
              <option value="todo">Do zrobienia</option>
              <option value="in_progress">W trakcie</option>
              <option value="blocked">Zablokowane</option>
              <option value="done">Zakończone</option>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority-filter">Priorytet</Label>
            <Select
              id="priority-filter"
              value={filters.priority ?? ""}
              onChange={(e) => setPriority(e.target.value || null)}
            >
              <option value="">Wszystkie</option>
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
            </Select>
          </div>

          {/* Private */}
          <div className="space-y-2">
            <Label htmlFor="private-filter">Widoczność</Label>
            <Select
              id="private-filter"
              value={filters.is_private === true ? "true" : filters.is_private === false ? "false" : ""}
              onChange={(e) => setIsPrivate(e.target.value ? e.target.value === "true" : null)}
            >
              <option value="">Wszystkie</option>
              <option value="false">Publiczne</option>
              <option value="true">Prywatne</option>
            </Select>
          </div>

          {/* Search - placeholder for future implementation */}
          <div className="space-y-2">
            <Label htmlFor="search-filter">Szukaj</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="search-filter" placeholder="Nazwa zadania..." className="pl-10" />
            </div>
          </div>
        </div>
      </div>
  );
}

