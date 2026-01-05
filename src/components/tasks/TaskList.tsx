import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { TaskCard } from "./TaskCard";
import { EditTaskModal } from "./EditTaskModal";
import type { TaskDTO } from "../../types";

interface TaskListProps {
  /** Filters from URL query params to apply to task fetching */
  filters?: Record<string, string | undefined>;
  /** Callback when a task card is clicked */
  onTaskClick?: (task: TaskDTO) => void;
  /** User ID for creating plan slots (enables "Add to Plan" button) */
  userId?: string;
}

/**
 * Fetch tasks from API with optional filters
 * Builds URLSearchParams from filters object and fetches from /api/tasks
 * @throws {Error} When fetch fails or response is not ok
 */
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

/**
 * TaskList component displays a grid of task cards
 * 
 * Features:
 * - React Query for data fetching with automatic caching
 * - Automatic refetch when filters change (queryKey includes filters)
 * - Loading state with Spinner
 * - Error state with user-friendly message
 * - Empty state when no tasks found
 * - Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop
 * 
 * States:
 * - isLoading: Shows spinner in center
 * - error: Shows red alert box with error message
 * - empty (!tasks || tasks.length === 0): Shows "Brak zadań" message
 * - success: Shows grid of TaskCard components
 * 
 * Performance:
 * - Click handler memoized with useCallback to prevent TaskCard re-renders
 * - React Query caching reduces API calls
 * 
 * @example
 * ```tsx
 * <TaskList 
 *   filters={{ status: 'todo', priority: 'high' }}
 *   onTaskClick={(task) => navigate(`/tasks/${task.id}`)}
 * />
 * ```
 */
export function TaskList({ filters = {}, onTaskClick, userId }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<TaskDTO | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ["tasks", filters],
    queryFn: () => fetchTasks(filters),
  });

  // Memoize the click handler to prevent unnecessary re-renders of TaskCard
  const handleTaskClick = useCallback((task: TaskDTO) => {
    if (onTaskClick) {
      onTaskClick(task);
    } else {
      // Default behavior: open edit modal
      setSelectedTask(task);
      setIsEditModalOpen(true);
    }
  }, [onTaskClick]);

  // Update selected task when modal closes to reset state
  const handleModalClose = useCallback((open: boolean) => {
    setIsEditModalOpen(open);
    if (!open) {
      setSelectedTask(null);
    }
  }, []);

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center py-12" 
        role="status" 
        aria-live="polite"
        aria-label="Ładowanie zadań"
      >
        <Spinner size="lg" />
        <span className="sr-only">Ładowanie zadań...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900"
        role="alert"
        aria-live="assertive"
      >
        Błąd ładowania zadań. Spróbuj odświeżyć stronę.
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div 
        className="rounded-lg border bg-muted p-12 text-center"
        role="status"
        aria-live="polite"
      >
        <p className="text-muted-foreground">Brak zadań do wyświetlenia</p>
      </div>
    );
  }

  return (
    <>
      <div 
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        aria-label={`Lista zadań (${tasks.length})`}
      >
        {tasks.map((task) => (
          <div key={task.id} role="listitem">
            <TaskCard task={task} onClick={() => handleTaskClick(task)} userId={userId} />
          </div>
        ))}
      </div>

      <EditTaskModal
        task={selectedTask}
        open={isEditModalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}

