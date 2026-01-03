import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

/**
 * Parse Postgres tstzrange string to Date objects
 * Format: "[2026-01-03T08:00:00Z, 2026-01-03T09:30:00Z)"
 */
export function parsePgRange(range: string): { start: Date; end: Date } {
  const match = range.match(/\[([^,]+),\s*([^)]+)\)/);
  if (!match) throw new Error(`Invalid range format: ${range}`);

  return {
    start: parseISO(match[1]),
    end: parseISO(match[2]),
  };
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
export function getDaySlots(date: Date): Date[] {
  const slots: Date[] = [];
  const start = startOfDay(date);

  for (let i = 0; i < 96; i++) {
    // 24 hours * 4 slots per hour
    const slot = new Date(start);
    slot.setMinutes(i * 15);
    slots.push(slot);
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

