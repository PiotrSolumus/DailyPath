import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { TaskCard } from "./TaskCard";
import type { TaskDTO } from "../../types";

interface TaskListProps {
  filters?: Record<string, string | undefined>;
  onTaskClick?: (task: TaskDTO) => void;
}

async function fetchTasks(filters: Record<string, string | undefined>): Promise<TaskDTO[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/tasks?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

export function TaskList({ filters = {}, onTaskClick }: TaskListProps) {
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900">
        Błąd ładowania zadań. Spróbuj odświeżyć stronę.
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="rounded-lg border bg-muted p-12 text-center">
        <p className="text-muted-foreground">Brak zadań do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
      ))}
    </div>
  );
}

