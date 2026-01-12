import { AppProviders } from "../../lib/contexts/AppProviders";
import { TimeLogList } from "./TimeLogList";
import type { UserMeDTO, TimeLogDTO } from "../../types";

interface TimeLogListWrapperProps {
  filters?: Record<string, string | undefined>;
  onEdit?: (timeLog: TimeLogDTO) => void;
  onDelete?: (timeLogId: string) => void;
  initialUser?: UserMeDTO | null;
}

export function TimeLogListWrapper({ filters, onEdit, onDelete, initialUser }: TimeLogListWrapperProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <TimeLogList filters={filters} onEdit={onEdit} onDelete={onDelete} />
    </AppProviders>
  );
}
