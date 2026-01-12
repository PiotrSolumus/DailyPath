import { AppProviders } from "../../lib/contexts/AppProviders";
import { CreateTaskModal } from "./CreateTaskModal";
import type { UserMeDTO } from "../../types";

interface CreateTaskModalWrapperProps {
  /** Initial user data from Astro middleware (for auth context) */
  initialUser?: UserMeDTO | null;
}

/**
 * CreateTaskModalWrapper component - wraps CreateTaskModal with required providers
 *
 * This wrapper ensures CreateTaskModal has access to:
 * - QueryProvider (React Query for mutations)
 * - AuthProvider (user authentication context)
 * - ToastProvider (toast notifications for success/error)
 * - NuqsAdapter (URL state management)
 *
 * @example
 * ```tsx
 * <CreateTaskModalWrapper initialUser={user} />
 * ```
 */
export function CreateTaskModalWrapper({ initialUser }: CreateTaskModalWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <CreateTaskModal />
    </AppProviders>
  );
}
