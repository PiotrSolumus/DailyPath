import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * ETA Calculator
 * Calculates estimated time of completion (ETA) for tasks based on planned slots
 */

interface PlanSlot {
  task_id: string;
  period: string; // tstzrange format: '["2026-01-05 14:00:00+00","2026-01-05 16:00:00+00")'
}

/**
 * Batch calculate ETA for multiple tasks
 * ETA is determined as the upper bound of the latest plan_slot for each task
 *
 * Performance optimization: Fetches all slots in one query instead of N queries
 *
 * @param supabase - Supabase client instance
 * @param taskIds - Array of task IDs to calculate ETA for
 * @returns Map of task_id -> ETA timestamp (or null if no slots)
 */
export async function batchCalculateETA(
  supabase: SupabaseClient<Database>,
  taskIds: string[]
): Promise<Map<string, string | null>> {
  // Early return for empty input
  if (taskIds.length === 0) return new Map();

  try {
    // Fetch all plan_slots for the given tasks in one query
    // Note: Cannot order by tstzrange type directly, so we'll sort in-memory
    const { data: slots, error } = await supabase.from("plan_slots").select("task_id, period").in("task_id", taskIds);

    if (error) {
      console.error("Error fetching plan slots for ETA calculation:", error);
      throw error;
    }

    // Initialize result map
    const etaMap = new Map<string, string | null>();

    // Group slots by task_id
    const slotsByTask = new Map<string, PlanSlot[]>();
    slots?.forEach((slot) => {
      if (!slotsByTask.has(slot.task_id)) {
        slotsByTask.set(slot.task_id, []);
      }
      slotsByTask.get(slot.task_id)!.push(slot);
    });

    // Calculate ETA for each task
    for (const taskId of taskIds) {
      const taskSlots = slotsByTask.get(taskId) || [];

      if (taskSlots.length === 0) {
        // No slots planned - ETA is null
        etaMap.set(taskId, null);
        continue;
      }

      // Find the latest slot by comparing upper bounds
      let latestSlot = taskSlots[0];
      let latestUpperBound = parseTstzrangeUpperBound(latestSlot.period);

      for (let i = 1; i < taskSlots.length; i++) {
        const currentUpperBound = parseTstzrangeUpperBound(taskSlots[i].period);
        if (currentUpperBound && latestUpperBound) {
          if (new Date(currentUpperBound) > new Date(latestUpperBound)) {
            latestSlot = taskSlots[i];
            latestUpperBound = currentUpperBound;
          }
        }
      }

      // Parse tstzrange to extract upper bound
      // Format: '["2026-01-05 14:00:00+00","2026-01-05 16:00:00+00")'
      const eta = parseTstzrangeUpperBound(latestSlot.period);
      etaMap.set(taskId, eta);
    }

    return etaMap;
  } catch (error) {
    console.error("Error in batchCalculateETA:", error);
    // Return empty ETAs on error to avoid breaking the entire request
    const fallbackMap = new Map<string, string | null>();
    taskIds.forEach((id) => fallbackMap.set(id, null));
    return fallbackMap;
  }
}

/**
 * Parse PostgreSQL tstzrange format to extract upper bound timestamp
 *
 * @param tstzrange - Range string like '["2026-01-05 14:00:00+00","2026-01-05 16:00:00+00")'
 * @returns Upper bound timestamp or null if parsing fails
 */
function parseTstzrangeUpperBound(tstzrange: string): string | null {
  try {
    // Match the upper bound: anything between the comma and closing bracket/paren
    // Handles both inclusive [) and exclusive () ranges
    const match = tstzrange.match(/,\s*"([^"]+)"[\)\]]/);

    if (match && match[1]) {
      // Convert to ISO 8601 format for consistency
      const upperBound = match[1];
      // If it's already in ISO format, return as-is
      // Otherwise, try to parse and convert
      if (upperBound.includes("T")) {
        return upperBound;
      }
      // Convert "2026-01-05 16:00:00+00" to "2026-01-05T16:00:00Z"
      return upperBound.replace(" ", "T").replace("+00", "Z");
    }

    return null;
  } catch (error) {
    console.error("Error parsing tstzrange:", tstzrange, error);
    return null;
  }
}

/**
 * Calculate total planned minutes for a task
 * Useful for comparing against estimate_minutes
 *
 * @param supabase - Supabase client instance
 * @param taskId - Task ID to calculate total for
 * @returns Total minutes planned for the task
 */
export async function calculateTotalPlannedMinutes(
  supabase: SupabaseClient<Database>,
  taskId: string
): Promise<number> {
  try {
    const { data: slots, error } = await supabase.from("plan_slots").select("period").eq("task_id", taskId);

    if (error) throw error;
    if (!slots || slots.length === 0) return 0;

    let totalMinutes = 0;

    for (const slot of slots) {
      const minutes = calculateRangeDurationMinutes(slot.period);
      totalMinutes += minutes;
    }

    return totalMinutes;
  } catch (error) {
    console.error("Error calculating total planned minutes:", error);
    return 0;
  }
}

/**
 * Calculate duration in minutes from a tstzrange
 *
 * @param tstzrange - Range string
 * @returns Duration in minutes
 */
function calculateRangeDurationMinutes(tstzrange: string): number {
  try {
    // Extract lower and upper bounds
    const lowerMatch = tstzrange.match(/[\[\(]\s*"([^"]+)"/);
    const upperMatch = tstzrange.match(/,\s*"([^"]+)"[\)\]]/);

    if (!lowerMatch || !upperMatch) return 0;

    const lower = new Date(lowerMatch[1]);
    const upper = new Date(upperMatch[1]);

    const diffMs = upper.getTime() - lower.getTime();
    return Math.floor(diffMs / 1000 / 60); // Convert to minutes
  } catch (error) {
    console.error("Error calculating range duration:", tstzrange, error);
    return 0;
  }
}
