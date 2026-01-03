import { AppProviders } from "../../lib/contexts/AppProviders";
import { ReportView } from "./ReportView";
import type { UserMeDTO } from "../../types";

interface ReportViewWrapperProps {
  initialFilters?: Record<string, string | undefined>;
  initialUser?: UserMeDTO | null;
}

export function ReportViewWrapper({ initialFilters, initialUser }: ReportViewWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <ReportView initialFilters={initialFilters} />
    </AppProviders>
  );
}

