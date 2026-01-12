import { AppProviders } from "../../lib/contexts/AppProviders";
import { TimeLogsView } from "./TimeLogsView";
import type { UserMeDTO } from "../../types";

interface TimeLogsViewWrapperProps {
  initialUser?: UserMeDTO | null;
  initialFilters?: {
    start_date?: string;
    end_date?: string;
  };
}

export function TimeLogsViewWrapper({ initialUser, initialFilters }: TimeLogsViewWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TimeLogsView initialFilters={initialFilters} />
    </AppProviders>
  );
}
