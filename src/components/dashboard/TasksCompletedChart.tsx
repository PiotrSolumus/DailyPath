import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import type { TaskDTO } from "../../types";

/**
 * Fetch all tasks from API
 */
async function fetchTasks(): Promise<TaskDTO[]> {
  const response = await fetch("/api/tasks");
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
}

/**
 * TasksCompletedChart - mini column chart showing completed tasks per month
 * Displays data for current year (January - December)
 */
export function TasksCompletedChart() {
  const {
    data: tasks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: fetchTasks,
  });

  // Group completed tasks by month
  const monthlyData = useMemo(() => {
    if (!tasks) return [];

    const currentYear = new Date().getFullYear();
    const completedTasks = tasks.filter((task) => task.status === "done");

    // Initialize all months with 0
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      count: 0,
      monthName: format(new Date(currentYear, i, 1), "MMM", { locale: pl }),
    }));

    // Count completed tasks per month
    completedTasks.forEach((task) => {
      try {
        // Use updated_at as completion date (when status was changed to done)
        const updatedAt = parseISO(task.updated_at);
        const taskYear = updatedAt.getFullYear();
        const taskMonth = updatedAt.getMonth() + 1; // 1-12

        if (taskYear === currentYear && taskMonth >= 1 && taskMonth <= 12) {
          months[taskMonth - 1].count++;
        }
      } catch (e) {
        // Skip invalid dates
        console.warn("Invalid date for task:", task.id, e);
      }
    });

    return months;
  }, [tasks]);

  // Find max count for scaling
  const maxCount = useMemo(() => {
    return Math.max(...monthlyData.map((m) => m.count), 1);
  }, [monthlyData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"></div>
        <span className="sr-only">Ładowanie wykresu…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">Błąd podczas ładowania wykresu</p>
      </div>
    );
  }

  const totalCompleted = monthlyData.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Zadania zakończone w {new Date().getFullYear()}</h3>
        <span className="text-xs text-muted-foreground">Razem: {totalCompleted}</span>
      </div>

      {totalCompleted === 0 ? (
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Brak zakończonych zadań w tym roku</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Chart bars */}
          <div className="flex items-end justify-between gap-1 h-32">
            {monthlyData.map(({ month, count, monthName }) => {
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;

              return (
                <div key={month} className="flex flex-col items-center flex-1 gap-1">
                  {/* Bar */}
                  <div className="relative w-full flex items-end justify-center" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
                      style={{
                        height: `${height}%`,
                        minHeight: count > 0 ? "4px" : "0",
                      }}
                      title={`${monthName}: ${count} ${count === 1 ? "zadanie" : count < 5 ? "zadania" : "zadań"}`}
                    >
                      {/* Count label on bar */}
                      {count > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-foreground whitespace-nowrap">
                          {count}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Month label */}
                  <div className="text-[10px] text-muted-foreground text-center leading-tight">
                    {monthName}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
