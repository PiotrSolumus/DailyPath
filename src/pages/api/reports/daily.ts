import type { APIRoute } from "astro";
import { getTasksByIds } from "@/lib/services/task.service";
import { getManagerDepartments, getUserDepartment } from "@/lib/services/auth.service";

export const prerender = false;

interface RangeParts {
  start: Date;
  end: Date;
  minutes: number;
}

function parseDate(value: string | undefined, fallbackDaysAgo = 7): Date {
  if (value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(0, 0, 0, 0);
      return d;
    }
  }
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - fallbackDaysAgo);
  return d;
}

function endOfDay(value: string | undefined, fallbackDaysAgo = 0): Date {
  if (value) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      d.setUTCHours(23, 59, 59, 999);
      return d;
    }
  }
  const d = new Date();
  d.setUTCHours(23, 59, 59, 999);
  d.setUTCDate(d.getUTCDate() - fallbackDaysAgo);
  return d;
}

function parsePeriod(period: string): RangeParts {
  // Format: "[2024-01-01T10:00:00.000Z,2024-01-01T10:15:00.000Z)"
  const match = period.match(/\[(.*?),(.*?)\)/);
  if (!match) {
    throw new Error("Invalid period format");
  }
  const start = new Date(match[1]);
  const end = new Date(match[2]);
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  return { start, end, minutes };
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Musisz być zalogowany",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const supabase = locals.supabaseAdmin;
  const searchParams = url.searchParams;
  const user = locals.user;
  const userRole = user.app_role;

  // Query params
  const startDate = parseDate(searchParams.get("start_date") ?? undefined, 7);
  const endDate = endOfDay(searchParams.get("end_date") ?? undefined, 0);
  const requestedUserId = searchParams.get("user_id") ?? undefined;
  const requestedDepartmentId = searchParams.get("department_id") ?? undefined;

  // Scope enforcement:
  // - Employee: only self
  // - Manager: can view users from their departments
  // - Admin: any user
  let scopedUserId = user.id;

  if (requestedUserId) {
    if (userRole === "admin") {
      scopedUserId = requestedUserId;
    } else if (userRole === "manager") {
      // Verify manager manages that user (by department)
      const managerDepartments = await getManagerDepartments(supabase, user.id);
      if (managerDepartments.size > 0) {
        // Fetch user's department
        const { data: membership } = await supabase
          .from("memberships")
          .select("department_id")
          .eq("user_id", requestedUserId)
          .contains("period", new Date().toISOString())
          .maybeSingle();

        const userDept = membership?.department_id ?? null;
        if (userDept && managerDepartments.has(userDept)) {
          scopedUserId = requestedUserId;
        } else {
          // Not authorized to view this user
          return new Response(
            JSON.stringify({ error: "Forbidden", message: "Brak uprawnień do podglądu tego użytkownika" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }

  // Optional department filter (informational)
  const scopedDepartmentId =
    requestedDepartmentId ?? user.active_department?.id ?? (await getUserDepartment(supabase, scopedUserId));
  const scopedDepartment =
    scopedDepartmentId && scopedDepartmentId !== "null"
      ? await supabase.from("departments").select("id, name").eq("id", scopedDepartmentId).maybeSingle()
      : null;

  try {
    // Fetch scoped user info for display
    const { data: scopedUser } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("id", scopedUserId)
      .maybeSingle();

    // 1) Fetch time logs for scoped user
    const { data: timeLogs, error: tlError } = await supabase
      .from("time_logs")
      .select("id, period, user_id, task_id")
      .eq("user_id", scopedUserId);

    if (tlError) {
      console.error("Error fetching time_logs:", tlError);
      throw tlError;
    }

    // 2) Fetch plan slots for scoped user
    const { data: planSlots, error: psError } = await supabase
      .from("plan_slots")
      .select("id, period, user_id, task_id")
      .eq("user_id", scopedUserId);

    if (psError) {
      console.error("Error fetching plan_slots:", psError);
      throw psError;
    }

    // 3) Filter by date range in code (UTC)
    const isInRange = (date: Date) => date >= startDate && date <= endDate;

    // Aggregate by day
    const dayMap = new Map<
      string,
      {
        logged: number;
        planned: number;
        taskIds: Set<string>;
      }
    >();

    for (const log of timeLogs ?? []) {
      try {
        const { start, end, minutes } = parsePeriod(log.period);
        if (!isInRange(start) && !isInRange(end)) continue;
        const key = formatDateKey(start);
        const entry = dayMap.get(key) ?? { logged: 0, planned: 0, taskIds: new Set<string>() };
        entry.logged += minutes;
        if (log.task_id) entry.taskIds.add(log.task_id);
        dayMap.set(key, entry);
      } catch (err) {
        console.warn("Skipping invalid time log period", log.id, err);
      }
    }

    for (const slot of planSlots ?? []) {
      try {
        const { start, end, minutes } = parsePeriod(slot.period);
        if (!isInRange(start) && !isInRange(end)) continue;
        const key = formatDateKey(start);
        const entry = dayMap.get(key) ?? { logged: 0, planned: 0, taskIds: new Set<string>() };
        entry.planned += minutes;
        if (slot.task_id) entry.taskIds.add(slot.task_id);
        dayMap.set(key, entry);
      } catch (err) {
        console.warn("Skipping invalid plan slot period", slot.id, err);
      }
    }

    // 4) Fetch tasks for status summary
    const allTaskIds = Array.from(new Set(Array.from(dayMap.values()).flatMap((d) => Array.from(d.taskIds))));
    const tasks = allTaskIds.length ? await getTasksByIds(supabase, user.id, userRole, allTaskIds) : [];
    const taskStatusMap = new Map(tasks.map((t) => [t.id, t.status]));

    // 5) Build response
    const reports = Array.from(dayMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, agg]) => {
        const statusCounts = new Map<string, number>();
        for (const taskId of agg.taskIds) {
          const status = taskStatusMap.get(taskId) ?? "unknown";
          statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
        }

        return {
          date,
          user_id: scopedUserId,
          user_name: scopedUser?.full_name || scopedUser?.email || scopedUserId,
          department_id: scopedDepartmentId ?? undefined,
          department_name: scopedDepartment?.data?.name ?? undefined,
          logged_minutes: agg.logged,
          plan_minutes: agg.planned,
          task_summary: Array.from(statusCounts.entries()).map(([status, count]) => ({
            status: status as any,
            count,
          })),
        };
      });

    return new Response(JSON.stringify(reports), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error) {
    console.error("Error in GET /api/reports/daily:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
