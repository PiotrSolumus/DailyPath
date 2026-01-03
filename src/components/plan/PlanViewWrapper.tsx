import { AppProviders } from "../../lib/contexts/AppProviders";
import { PlanView } from "./PlanView";
import type { UserMeDTO } from "../../types";

interface PlanViewWrapperProps {
  userId: string;
  timezone: string;
  isManagerView?: boolean;
  initialUser?: UserMeDTO | null;
}

export function PlanViewWrapper({ userId, timezone, isManagerView, initialUser }: PlanViewWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <PlanView userId={userId} timezone={timezone} isManagerView={isManagerView} />
    </AppProviders>
  );
}

