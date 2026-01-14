import { AppProviders } from "../../lib/contexts/AppProviders";
import { DashboardStats } from "./DashboardStats";
import { DashboardTaskList } from "./DashboardTaskList";
import { MiniPlanCalendar } from "./MiniPlanCalendar";
import { TasksCompletedChart } from "./TasksCompletedChart";
import type { UserMeDTO } from "../../types";

interface DashboardViewProps {
  userId: string;
  timezone: string;
  initialUser?: UserMeDTO | null;
}

/**
 * DashboardView component combines stats, plan calendar, chart and task list
 * Wrapped with AppProviders to ensure QueryClient is available
 */
export function DashboardView({ userId, timezone, initialUser }: DashboardViewProps) {
  return (
    <AppProviders initialUser={initialUser}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Witaj w DailyPath!</p>
        </div>

        <DashboardStats userId={userId} />

        <div className="rounded-lg border bg-card p-6">
          <TasksCompletedChart />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-lg border bg-card p-6">
              <MiniPlanCalendar userId={userId} timezone={timezone} />
            </div>
          </div>

          <div className="lg:col-span-2">
            <DashboardTaskList userId={userId} />
          </div>
        </div>
      </div>
    </AppProviders>
  );
}
