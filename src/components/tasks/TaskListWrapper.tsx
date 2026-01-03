import { AppProviders } from "../../lib/contexts/AppProviders";
import { TaskList } from "./TaskList";
import type { TaskDTO, UserMeDTO } from "../../types";

interface TaskListWrapperProps {
  filters?: Record<string, string | undefined>;
  onTaskClick?: (task: TaskDTO) => void;
  initialUser?: UserMeDTO | null;
}

export function TaskListWrapper({ filters, onTaskClick, initialUser }: TaskListWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TaskList filters={filters} onTaskClick={onTaskClick} />
    </AppProviders>
  );
}

