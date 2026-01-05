import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { PlanSlotDTO, CreatePlanSlotCommand } from "@/types";
import type { PlanSlotQueryParams } from "@/lib/schemas/plan-slot.schema";
import { parsePgRange, is15MinAligned } from "@/lib/utils/time";

/**
 * Plan Slot Service
 * Handles business logic for plan slot CRUD operations
 */

/**
 * List plan slots with filtering by user and date range
 *
 * @param supabase - Supabase client instance
 * @param userId - Current authenticated user ID
 * @param filters - Query parameters for filtering plan slots
 * @returns Array of PlanSlotDTO objects
 */
export async function listPlanSlots(
  supabase: SupabaseClient<Database>,
  userId: string,
  filters: PlanSlotQueryParams
): Promise<PlanSlotDTO[]> {
  try {
    // Build query - fetch all slots for user
    // We'll filter by date range in the application layer since
    // Supabase JS client doesn't easily support tstzrange operators
    const { data: slots, error } = await supabase
      .from("plan_slots")
      .select("id, task_id, user_id, period, allow_overlap")
      .eq("user_id", filters.user_id);

    if (error) {
      console.error("Error fetching plan slots:", error);
      throw error;
    }

    if (!slots || slots.length === 0) {
      return [];
    }

    // Parse date range for filtering
    // Note: We compare using full datetime to be safe, expanding the range by 24h on each side
    // to account for timezone differences. The frontend will do the precise day filtering.
    const startDate = new Date(`${filters.start_date}T00:00:00.000Z`);
    const endDate = new Date(`${filters.end_date}T23:59:59.999Z`);
    
    // Add 24 hours buffer on each side to catch edge cases with timezones
    const bufferMs = 24 * 60 * 60 * 1000;
    const startWithBuffer = new Date(startDate.getTime() - bufferMs);
    const endWithBuffer = new Date(endDate.getTime() + bufferMs);

    // Filter slots by date range in application
    const filteredSlots = slots.filter((slot) => {
      try {
        const { start: slotStart } = parsePgRange(slot.period as string);
        return slotStart >= startWithBuffer && slotStart <= endWithBuffer;
      } catch (e) {
        console.error("Error parsing slot period:", slot.period, e);
        return false;
      }
    });

    // Map to DTO
    const planSlotDTOs: PlanSlotDTO[] = filteredSlots.map((slot) => ({
      id: slot.id.toString(),
      task_id: slot.task_id,
      user_id: slot.user_id,
      period: slot.period as string,
      allow_overlap: slot.allow_overlap,
    }));

    console.log(`Found ${planSlotDTOs.length} plan slots for user ${userId} between ${filters.start_date} and ${filters.end_date}`);
    return planSlotDTOs;
  } catch (error) {
    console.error("Error in listPlanSlots service:", error);
    throw error;
  }
}

/**
 * Create a new plan slot
 *
 * Validates:
 * - 15-minute alignment
 * - Period duration > 0
 * - User permissions (only managers can create slots for other users)
 * - No overlaps (if allow_overlap is false)
 *
 * @param supabase - Supabase client instance
 * @param currentUserId - Current authenticated user ID
 * @param currentUserRole - Current user's app_role
 * @param data - Plan slot creation data
 * @returns Created plan slot ID
 */
export async function createPlanSlot(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  currentUserRole: string,
  data: CreatePlanSlotCommand
): Promise<string> {
  try {
    // 1. Validate that user can create slot for target user
    if (data.user_id !== currentUserId && currentUserRole !== "manager" && currentUserRole !== "admin") {
      throw new Error("Only managers can create plan slots for other users");
    }

    // 2. Parse and validate period
    const { start, end } = parsePgRange(data.period);

    // Check duration
    if (end <= start) {
      throw new Error("Plan slot end time must be after start time");
    }

    // Check 15-minute alignment
    if (!is15MinAligned(start) || !is15MinAligned(end)) {
      throw new Error("Plan slot times must be aligned to 15-minute intervals");
    }

    // Check minimum duration (15 minutes)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
      throw new Error("Plan slot duration must be at least 15 minutes");
    }

    // 3. Check for overlaps if allow_overlap is false
    if (!data.allow_overlap) {
      // Fetch all slots for the user on the same day to check for overlaps
      // We'll do overlap checking in JavaScript since Supabase JS client may not support range operators
      const { data: existingSlots, error: overlapError } = await supabase
        .from("plan_slots")
        .select("id, period")
        .eq("user_id", data.user_id)
        .eq("allow_overlap", false);

      if (overlapError) {
        console.error("Error checking for overlaps:", overlapError);
        throw overlapError;
      }

      // Check for overlaps manually
      if (existingSlots && existingSlots.length > 0) {
        for (const slot of existingSlots) {
          const { start: existingStart, end: existingEnd } = parsePgRange(slot.period as string);
          
          // Check if ranges overlap: (start1 < end2) AND (start2 < end1)
          if (start < existingEnd && existingStart < end) {
            throw new Error("Plan slot overlaps with existing slot. Set allow_overlap to true to force.");
          }
        }
      }
    }

    // 4. Verify task exists and user has access to it
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id")
      .eq("id", data.task_id)
      .single();

    if (taskError || !task) {
      throw new Error("Task not found or access denied");
    }

    // 5. Insert plan slot
    const insertData: Database["public"]["Tables"]["plan_slots"]["Insert"] = {
      task_id: data.task_id,
      user_id: data.user_id,
      period: data.period,
      allow_overlap: data.allow_overlap,
      created_by_user_id: currentUserId,
    };

    const { data: slot, error } = await supabase
      .from("plan_slots")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating plan slot:", error);
      throw error;
    }

    if (!slot) {
      throw new Error("Failed to create plan slot");
    }

    return slot.id.toString();
  } catch (error) {
    console.error("Error in createPlanSlot service:", error);
    throw error;
  }
}

/**
 * Update an existing plan slot
 *
 * @param supabase - Supabase client instance
 * @param currentUserId - Current authenticated user ID
 * @param slotId - Plan slot ID to update
 * @param updates - Partial updates to apply
 * @returns void
 */
export async function updatePlanSlot(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  slotId: string,
  updates: { period?: string; allow_overlap?: boolean }
): Promise<void> {
  try {
    // 1. Verify slot exists and user has access
    const { data: existingSlot, error: fetchError } = await supabase
      .from("plan_slots")
      .select("user_id, period")
      .eq("id", slotId)
      .single();

    if (fetchError || !existingSlot) {
      throw new Error("Plan slot not found or access denied");
    }

    // 2. Validate period if provided
    if (updates.period) {
      const { start, end } = parsePgRange(updates.period);

      if (end <= start) {
        throw new Error("Plan slot end time must be after start time");
      }

      if (!is15MinAligned(start) || !is15MinAligned(end)) {
        throw new Error("Plan slot times must be aligned to 15-minute intervals");
      }

      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        throw new Error("Plan slot duration must be at least 15 minutes");
      }
    }

    // 3. Update slot
    const updateData: Partial<Database["public"]["Tables"]["plan_slots"]["Update"]> = {};
    
    if (updates.period !== undefined) {
      updateData.period = updates.period;
    }
    
    if (updates.allow_overlap !== undefined) {
      updateData.allow_overlap = updates.allow_overlap;
    }

    const { error } = await supabase
      .from("plan_slots")
      .update(updateData)
      .eq("id", slotId);

    if (error) {
      console.error("Error updating plan slot:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updatePlanSlot service:", error);
    throw error;
  }
}

/**
 * Delete a plan slot
 *
 * @param supabase - Supabase client instance
 * @param currentUserId - Current authenticated user ID
 * @param slotId - Plan slot ID to delete
 * @returns void
 */
export async function deletePlanSlot(
  supabase: SupabaseClient<Database>,
  currentUserId: string,
  slotId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("plan_slots")
      .delete()
      .eq("id", slotId);

    if (error) {
      console.error("Error deleting plan slot:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in deletePlanSlot service:", error);
    throw error;
  }
}

