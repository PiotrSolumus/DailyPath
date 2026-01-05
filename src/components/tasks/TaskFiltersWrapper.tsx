import { AppProviders } from "../../lib/contexts/AppProviders";
import { TaskFilters } from "./TaskFilters";
import type { UserMeDTO } from "../../types";

interface TaskFiltersWrapperProps {
  /** Initial user data from Astro middleware (for auth context) */
  initialUser?: UserMeDTO | null;
}

/**
 * TaskFiltersWrapper component - wraps TaskFilters with required providers
 * 
 * This wrapper ensures TaskFilters has access to:
 * - QueryProvider (React Query)
 * - AuthProvider (user authentication context)
 * - ToastProvider (toast notifications)
 * - NuqsAdapter (URL state management for filter sync)
 * 
 * @example
 * ```tsx
 * <TaskFiltersWrapper initialUser={user} />
 * ```
 */
export function TaskFiltersWrapper({ initialUser }: TaskFiltersWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TaskFilters />
    </AppProviders>
  );
}

