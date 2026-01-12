import { AppProviders } from "../../lib/contexts/AppProviders";
import { AdminView } from "./AdminView";
import type { UserMeDTO } from "../../types";

interface AdminViewWrapperProps {
  initialUser?: UserMeDTO | null;
}

export function AdminViewWrapper({ initialUser }: AdminViewWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <AdminView />
    </AppProviders>
  );
}
