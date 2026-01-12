import type { APIRoute } from "astro";
import { listTasks } from "@/lib/services/task.service";
import { getUserDepartment } from "@/lib/services/auth.service";
import { handleApiError } from "@/lib/utils/error-handler";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/time-logs/tasks
 *
 * Returns tasks available for the currently logged-in user to log time against.
 * In current requirements: only tasks assigned directly to the logged-in user.
 */
export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Proszę wybrać użytkownika na stronie /login",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { id: userId, app_role: userRole, active_department } = locals.user;

    // Ustal aktywny dział użytkownika (z locals albo z bazy jako rezerwowe źródło)
    const departmentId = active_department?.id ?? (await getUserDepartment(locals.supabaseAdmin, userId));

    // 1) Zadania przypisane bezpośrednio do użytkownika
    const userTasks = await listTasks(locals.supabaseAdmin, userId, userRole, {
      assigned_to_user_id: locals.user.id,
    });

    // 2) Zadania przypisane do aktywnego działu użytkownika (jeśli istnieje)
    const departmentTasks = departmentId
      ? await listTasks(locals.supabaseAdmin, userId, userRole, {
          department_id: departmentId,
        })
      : [];

    // 3) Połącz i usuń duplikaty po id
    const taskMap = new Map(userTasks.map((task) => [task.id, task]));
    for (const task of departmentTasks) {
      taskMap.set(task.id, task);
    }

    const tasks = Array.from(taskMap.values());

    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};
