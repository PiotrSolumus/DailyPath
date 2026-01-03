import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Spinner } from "../ui/spinner";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import type { DailyReportDTO } from "../../types";

interface DailyReportProps {
  filters: Record<string, string | undefined>;
}

async function fetchDailyReport(filters: Record<string, string | undefined>): Promise<DailyReportDTO[]> {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/reports/daily?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch daily report");
  }

  return response.json();
}

export function DailyReport({ filters }: DailyReportProps) {
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ["daily-report", filters],
    queryFn: () => fetchDailyReport(filters),
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
        Błąd ładowania raportu. Spróbuj odświeżyć stronę.
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="rounded-lg border bg-muted p-12 text-center">
        <p className="text-muted-foreground">Brak danych do wyświetlenia dla wybranych filtrów</p>
      </div>
    );
  }

  const totalLoggedMinutes = reports.reduce((sum, r) => sum + r.logged_minutes, 0);
  const totalPlanMinutes = reports.reduce((sum, r) => sum + r.plan_minutes, 0);
  const taskStats = reports.flatMap((r) => r.task_summary);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Zarejestrowany czas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(totalLoggedMinutes / 60)}h {totalLoggedMinutes % 60}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Zaplanowany czas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(totalPlanMinutes / 60)}h {totalPlanMinutes % 60}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              Różnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${totalLoggedMinutes > totalPlanMinutes ? "text-yellow-600" : "text-green-600"}`}>
              {Math.abs(Math.floor((totalLoggedMinutes - totalPlanMinutes) / 60))}h{" "}
              {Math.abs((totalLoggedMinutes - totalPlanMinutes) % 60)}min
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed table */}
      <Card>
        <CardHeader>
          <CardTitle>Szczegóły raportu dziennego</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium">Data</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Użytkownik</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Dział</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Zarejestrowany czas</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Zaplanowany czas</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Zadania</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-3 text-sm">{report.date}</td>
                    <td className="px-4 py-3 text-sm">{report.user_id ?? "-"}</td>
                    <td className="px-4 py-3 text-sm">{report.department_id ?? "-"}</td>
                    <td className="px-4 py-3 text-right text-sm">
                      {Math.floor(report.logged_minutes / 60)}h {report.logged_minutes % 60}min
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {Math.floor(report.plan_minutes / 60)}h {report.plan_minutes % 60}min
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {report.task_summary.map((ts) => `${ts.status}: ${ts.count}`).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

