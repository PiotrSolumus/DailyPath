import { AppProviders } from "../../lib/contexts/AppProviders";
import { SettingsView } from "./SettingsView";
import type { UserMeDTO } from "../../types";

interface SettingsViewWrapperProps {
  initialUser?: UserMeDTO | null;
}

export function SettingsViewWrapper({ initialUser }: SettingsViewWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <SettingsView initialUser={initialUser} />
    </AppProviders>
  );
}
