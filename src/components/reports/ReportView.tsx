import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ReportFilters } from "./ReportFilters";
import { DailyReport } from "./DailyReport";
import { exportToCSV, flattenForCSV } from "../../lib/utils/csv-export";
import { getErrorMessage } from "../../lib/utils/error-messages";
import type { DailyReportDTO } from "../../types";

interface ReportViewProps {
  initialFilters?: Record<string, string | undefined>;
}

async function fetchReportData(filters: Record<string, string | undefined>): Promise<DailyReportDTO[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/reports/daily?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch report data");
  }

  return response.json();
}

export function ReportView({ initialFilters = {} }: ReportViewProps) {
  const [isExporting, setIsExporting] = useState(false);

  const { data: reportData } = useQuery({
    queryKey: ["report-data", initialFilters],
    queryFn: () => fetchReportData(initialFilters),
  });

  const handleExport = async () => {
    if (!reportData || reportData.length === 0) {
      toast.error("Brak danych do eksportu");
      return;
    }

    setIsExporting(true);

    try {
      // Flatten data for CSV
      const flatData = flattenForCSV(
        reportData.map((r) => ({
          data: r.date,
          uzytkownik: r.user_name ?? r.user_id ?? "Wszyscy",
          dzial: r.department_name ?? r.department_id ?? "Wszystkie",
          zarejestrowany_czas_minuty: r.logged_minutes,
          zaplanowany_czas_minuty: r.plan_minutes,
          zadania: r.task_summary.map((ts) => `${ts.status}: ${ts.count}`).join("; "),
        })),
      );

      exportToCSV(flatData, "raport_dzienny");
      toast.success("Raport został wyeksportowany");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReportFilters onExport={handleExport} isExporting={isExporting} />
      <DailyReport filters={initialFilters} />
    </div>
  );
}

