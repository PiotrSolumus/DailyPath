import { AppProviders } from "../../lib/contexts/AppProviders";
import { TaskList } from "./TaskList";
import type { TaskDTO, UserMeDTO } from "../../types";

interface TaskListWrapperProps {
  /** Optional filters to apply to task list (from URL query params) */
  filters?: Record<string, string | undefined>;
  /** Callback when a task card is clicked */
  onTaskClick?: (task: TaskDTO) => void;
  /** Initial user data from Astro middleware (for auth context) */
  initialUser?: UserMeDTO | null;
}

/**
 * TaskListWrapper component - wraps TaskList with required providers
 *
 * This wrapper ensures TaskList has access to:
 * - QueryProvider (React Query for data fetching)
 * - AuthProvider (user authentication context)
 * - ToastProvider (toast notifications)
 * - NuqsAdapter (URL state management)
 *
 * @example
 * ```tsx
 * <TaskListWrapper
 *   initialUser={user}
 *   filters={filters}
 *   onTaskClick={(task) => console.log(task)}
 * />
 * ```
 */
export function TaskListWrapper({ filters, onTaskClick, initialUser }: TaskListWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TaskList filters={filters} onTaskClick={onTaskClick} userId={initialUser?.id} />
    </AppProviders>
  );
}
