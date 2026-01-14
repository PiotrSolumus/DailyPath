import { useQuery } from "@tanstack/react-query";
import type { TaskDTO } from "../../types";

interface DashboardStatsProps {
  userId: string;
}

/**
 * Fetch tasks from API
 */
async function fetchTasks(): Promise<TaskDTO[]> {
  const response = await fetch("/api/tasks");
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

/**
 * DashboardStats component displays key metrics:
 * - Number of active tasks (status != 'done')
 * - Number of completed tasks (status == 'done')
 */
export function DashboardStats({ userId }: DashboardStatsProps) {
  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: fetchTasks,
  });

  if (tasksLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-2"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <p className="text-destructive">Błąd podczas ładowania statystyk</p>
      </div>
    );
  }

  const activeTasks = tasks?.filter((task) => task.status !== "done") ?? [];
  const completedTasks = tasks?.filter((task) => task.status === "done") ?? [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Zadania aktywne</h3>
        <p className="mt-2 text-3xl font-bold">{activeTasks.length}</p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-sm font-medium text-muted-foreground">Zadania wykonane</h3>
        <p className="mt-2 text-3xl font-bold">{completedTasks.length}</p>
      </div>
    </div>
  );
}
