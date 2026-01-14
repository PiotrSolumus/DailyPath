import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { TaskDTO } from "../../types";
import { TaskCard } from "../tasks/TaskCard";

interface DashboardTaskListProps {
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
 * Priority order: high -> medium -> low
 */
const priorityOrder: Record<"high" | "medium" | "low", number> = {
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Sort tasks by priority (high -> medium -> low)
 */
function sortTasksByPriority(tasks: TaskDTO[]): TaskDTO[] {
  return [...tasks].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * DashboardTaskList component displays tasks sorted by priority
 * Shows only active tasks (status != 'done')
 * Tasks are sorted from highest priority (high) to lowest (low)
 */
export function DashboardTaskList({ userId }: DashboardTaskListProps) {
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: fetchTasks,
  });

  const sortedTasks = useMemo(() => {
    if (!tasks) return [];
    // Filter out completed tasks and sort by priority
    const activeTasks = tasks.filter((task) => task.status !== "done");
    return sortTasksByPriority(activeTasks);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"></div>
        <span className="sr-only">Ładowanie zadań…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
        <p className="text-destructive">Błąd podczas ładowania zadań</p>
      </div>
    );
  }

  if (sortedTasks.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <p className="text-muted-foreground">Brak aktywnych zadań</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight">Zadania według priorytetu</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedTasks.map((task) => (
          <TaskCard key={task.id} task={task} userId={userId} />
        ))}
      </div>
    </div>
  );
}
