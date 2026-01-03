import { AppProviders } from "../../lib/contexts/AppProviders";
import { TaskFilters } from "./TaskFilters";
import type { UserMeDTO } from "../../types";

interface TaskFiltersWrapperProps {
  initialUser?: UserMeDTO | null;
}

export function TaskFiltersWrapper({ initialUser }: TaskFiltersWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TaskFilters />
    </AppProviders>
  );
}

