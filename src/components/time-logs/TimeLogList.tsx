import { useQuery } from "@tanstack/react-query";
import { Spinner } from "../ui/spinner";
import { TimeLogCard } from "./TimeLogCard";
import type { TimeLogDTO } from "../../types";

interface TimeLogListProps {
  filters?: Record<string, string | undefined>;
  onEdit?: (timeLog: TimeLogDTO) => void;
  onDelete?: (timeLogId: string) => void;
}

async function fetchTimeLogs(filters: Record<string, string | undefined>): Promise<TimeLogDTO[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/time-logs?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch time logs");
  }

  return response.json();
}

export function TimeLogList({ filters = {}, onEdit, onDelete }: TimeLogListProps) {
  const {
    data: timeLogs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["time-logs", filters],
    queryFn: () => fetchTimeLogs(filters),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-900">
        Błąd ładowania logów czasu. Spróbuj odświeżyć stronę.
      </div>
    );
  }

  if (!timeLogs || timeLogs.length === 0) {
    return (
      <div className="rounded-lg border bg-muted p-12 text-center">
        <p className="text-muted-foreground">Brak logów czasu do wyświetlenia</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {timeLogs.map((timeLog) => (
        <TimeLogCard key={timeLog.id} timeLog={timeLog} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
