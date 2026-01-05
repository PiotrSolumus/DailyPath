import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useTaskFilters } from "../../lib/utils/query-params";

/**
 * TaskFilters component - provides filtering UI for tasks
 * 
 * Features:
 * - Status filter (todo, in_progress, blocked, done)
 * - Priority filter (low, medium, high)
 * - Visibility filter (public/private)
 * - Search input (placeholder for future implementation)
 * - Clear all filters button (conditional rendering)
 * - URL synchronization via nuqs
 * 
 * @example
 * ```tsx
 * <TaskFilters />
 * ```
 */
export function TaskFilters() {
  const { filters, setStatus, setPriority, setDepartmentId, setUserId, setIsPrivate, clearFilters } =
    useTaskFilters();

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);
  
  return (
    <section className="space-y-4 rounded-lg border bg-card p-4" aria-labelledby="filters-heading">
        <div className="flex items-center justify-between">
          <h3 id="filters-heading" className="font-medium">Filtry</h3>
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              aria-label="Wyczyść wszystkie filtry"
            >
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input 
                id="search-filter" 
                placeholder="Nazwa zadania..." 
                className="pl-10"
                aria-label="Wyszukaj zadanie po nazwie"
                disabled
                title="Funkcja wyszukiwania będzie dostępna wkrótce"
              />
            </div>
          </div>
        </div>
      </section>
  );
}

