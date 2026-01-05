import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/**
 * Parse Postgres tstzrange string to Date objects
 * Format: "[2026-01-03T08:00:00Z, 2026-01-03T09:30:00Z)"
 * Also handles formats with quotes: '["2026-01-03 08:00:00+00", "2026-01-03 09:30:00+00")'
 */
export function parsePgRange(range: string): { start: Date; end: Date } {
  // Regex that handles optional quotes and various separators
  const match = range.match(/[\[\(]"?([^",]+)"?,\s*"?([^"\)]+)"?[\)\]]/);
  
  if (!match) {
    console.error(`Invalid range format: ${range}`);
    throw new Error(`Invalid range format: ${range}`);
  }

  // Normalize by replacing spaces with T if needed and trimming quotes
  const startStr = match[1].trim().replace(" ", "T");
  const endStr = match[2].trim().replace(" ", "T");

  const start = parseISO(startStr);
  const end = parseISO(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error(`Invalid dates in range: ${range} -> ${startStr}, ${endStr}`);
    throw new Error(`Invalid dates in range: ${range}`);
  }

  return { start, end };
}

/**
 * Format Date objects to Postgres tstzrange string
 */
export function formatPgRange(start: Date, end: Date): string {
  return `[${start.toISOString()}, ${end.toISOString()})`;
}

/**
 * Check if time is aligned to 15-minute intervals
 */
export function is15MinAligned(date: Date): boolean {
  const minutes = date.getMinutes();
  return minutes % 15 === 0;
}

/**
 * Round time to nearest 15-minute interval (using .5 rounds up rule)
 */
export function roundTo15Min(date: Date): Date {
  const minutes = date.getMinutes();
  const remainder = minutes % 15;
  const rounded = new Date(date);

  if (remainder >= 7.5) {
    rounded.setMinutes(minutes + (15 - remainder), 0, 0);
  } else {
    rounded.setMinutes(minutes - remainder, 0, 0);
  }

  return rounded;
}

/**
 * Get time slots for a day in 15-minute intervals
 */
export function getDaySlots(date: Date, startHour: number = 6, endHour: number = 22): Date[] {
  const slots: Date[] = [];
  const start = startOfDay(date);
  
  // Calculate number of 15-minute slots between startHour and endHour
  const totalSlots = (endHour - startHour) * 4;
  
  for (let i = 0; i < totalSlots; i++) {
    const slot = new Date(start);
    slot.setHours(startHour);
    slot.setMinutes(i * 15);
    slots.push(slot);
  }

  return slots;
}

/**
 * Get time slots for a day in 15-minute intervals, generated in a specific timezone.
 *
 * This avoids hour shifts when the user's `timezone` differs from the browser/system timezone.
 */
export function getDaySlotsInTimeZone(date: Date, timezone: string, startHour: number = 6, endHour: number = 22): Date[] {
  const slots: Date[] = [];

  // Interpret `date` as a day in the provided timezone.
  const day = formatInTimeZone(date, timezone, "yyyy-MM-dd");
  const totalSlots = (endHour - startHour) * 4;

  for (let i = 0; i < totalSlots; i++) {
    const hour = startHour + Math.floor(i / 4);
    const minute = (i % 4) * 15;
    const localIso = `${day}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
    slots.push(fromZonedTime(localIso, timezone));
  }

  return slots;
}

/**
 * Format time for display in calendar
 */
export function formatTimeSlot(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, "HH:mm");
}

/**
 * Calculate position and height for a task slot in the calendar grid
 * @param startTime - Task start time
 * @param endTime - Task end time
 * @param gridStartHour - Hour when grid starts (default 6)
 * @param slotHeightPx - Height of each 15-min slot in pixels (default 40)
 * @returns Object with top position and height in pixels
 */
export function calculateSlotPosition(
  startTime: Date,
  endTime: Date,
  gridStartHour: number = 6,
  slotHeightPx: number = 40,
  timezone?: string
): { top: number; height: number } {
  // Calculate slot index from start of grid using the provided timezone
  const startHour = timezone ? Number(formatInTimeZone(startTime, timezone, "H")) : startTime.getHours();
  const startMinute = timezone ? Number(formatInTimeZone(startTime, timezone, "m")) : startTime.getMinutes();
  const startSlotIndex = (startHour - gridStartHour) * 4 + startMinute / 15;
  
  // Calculate duration in 15-minute slots
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationSlots = durationMs / (15 * 60 * 1000);
  
  return {
    top: startSlotIndex * slotHeightPx,
    height: durationSlots * slotHeightPx,
  };
}

/**
 * Get duration in minutes between two dates
 */
export function getDurationMinutes(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Check if two time ranges overlap
 */
export function rangesOverlap(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Get week boundaries for calendar view
 */
export function getWeekBoundaries(date: Date, weekStartsOn: 0 | 1 = 1): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn }),
    end: endOfWeek(date, { weekStartsOn }),
  };
}

/**
 * Format date for API queries (ISO date string)
 */
export function formatDateForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Navigate to previous/next week
 */
export function navigateWeek(currentDate: Date, direction: "prev" | "next"): Date {
  return direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
}

/**
 * Navigate to previous/next day
 */
export function navigateDay(currentDate: Date, direction: "prev" | "next"): Date {
  return direction === "prev" ? addDays(currentDate, -1) : addDays(currentDate, 1);
}

