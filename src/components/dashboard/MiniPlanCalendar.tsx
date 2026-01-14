import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  parsePgRange,
  formatTimeSlot,
  formatDateForApi,
} from "../../lib/utils/time";
import { fromZonedTime } from "date-fns-tz";
import type { PlanSlotDTO, TaskDTO } from "../../types";
import { TaskSlot } from "../calendar/TaskSlot";

interface MiniPlanCalendarProps {
  userId: string;
  timezone: string;
}

/**
 * Fetch plan slots for today
 */
async function fetchTodayPlanSlots(userId: string, today: string): Promise<PlanSlotDTO[]> {
  const response = await fetch(`/api/plan-slots?user_id=${userId}&start_date=${today}&end_date=${today}`);
  if (!response.ok) {
    throw new Error("Failed to fetch plan slots");
  }
  return response.json();
}

/**
 * Fetch tasks by IDs
 */
async function fetchTasksByIds(taskIds: string[]): Promise<TaskDTO[]> {
  if (taskIds.length === 0) return [];
  const response = await fetch(`/api/tasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  const allTasks = await response.json();
  return allTasks.filter((task: TaskDTO) => taskIds.includes(task.id));
}

/**
 * MiniPlanCalendar - compact hourly view of today's plan
 * Displays plan slots in a smaller, read-only calendar grid
 */
export function MiniPlanCalendar({ userId, timezone }: MiniPlanCalendarProps) {
  const today = new Date();
  const todayStr = formatDateForApi(today);

  const {
    data: planSlots,
    isLoading: planLoading,
    error: planError,
  } = useQuery({
    queryKey: ["dashboard-plan", userId, todayStr],
    queryFn: () => fetchTodayPlanSlots(userId, todayStr),
  });

  const taskIds = useMemo(() => {
    const ids = (planSlots ?? []).map((s) => s.task_id);
    return Array.from(new Set(ids)).sort();
  }, [planSlots]);

  const {
    data: tasks,
    isLoading: tasksLoading,
  } = useQuery({
    queryKey: ["tasks-by-ids", taskIds],
    queryFn: () => fetchTasksByIds(taskIds),
    enabled: taskIds.length > 0,
  });

  // Generate hourly slots (1h intervals) instead of 15-minute intervals
  const timeSlots = useMemo(() => {
    const slots: Date[] = [];
    const day = formatInTimeZone(today, timezone, "yyyy-MM-dd");
    const startHour = 6;
    const endHour = 22;
    const totalHours = endHour - startHour;

    for (let i = 0; i < totalHours; i++) {
      const hour = startHour + i;
      const localIso = `${day}T${String(hour).padStart(2, "0")}:00:00`;
      slots.push(fromZonedTime(localIso, timezone));
    }

    return slots;
  }, [today, timezone]);
  const totalSlots = timeSlots.length;

  // Filter slots for today only
  const todaySlots = useMemo(() => {
    if (!planSlots || !tasks) return [];
    const currentDay = formatInTimeZone(today, timezone, "yyyy-MM-dd");
    const tasksById = new Map(tasks.map((task) => [task.id, task]));

    return planSlots
      .map((slot) => {
        const { start } = parsePgRange(slot.period);
        const slotDay = formatInTimeZone(start, timezone, "yyyy-MM-dd");
        if (slotDay !== currentDay) return null;

        const task = tasksById.get(slot.task_id);
        if (!task) return null;

        return { slot, task, start, end: parsePgRange(slot.period).end };
      })
      .filter((item): item is { slot: PlanSlotDTO; task: TaskDTO; start: Date; end: Date } => item !== null);
  }, [planSlots, tasks, today, timezone]);

  // Check for overlaps
  const slotsWithOverlap = useMemo(() => {
    const overlapSet = new Set<string>();
    todaySlots.forEach((item, i) => {
      todaySlots.forEach((other, j) => {
        if (i === j) return;
        const { start, end } = item;
        const { start: otherStart, end: otherEnd } = other;
        if (
          (start < otherEnd && end > otherStart && !item.slot.allow_overlap && !other.slot.allow_overlap) ||
          (item.slot.allow_overlap && other.slot.allow_overlap && start < otherEnd && end > otherStart)
        ) {
          overlapSet.add(item.slot.id);
          overlapSet.add(other.slot.id);
        }
      });
    });
    return overlapSet;
  }, [todaySlots]);

  if (planLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground"></div>
        <span className="sr-only">Ładowanie planu…</span>
      </div>
    );
  }

  if (planError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">Błąd podczas ładowania planu</p>
      </div>
    );
  }

  // Compact grid - hourly slots (40px per hour)
  const slotHeightPx = 40;
  const gridStartHour = 6;

  // Calculate position for hourly slots
  const calculateHourlyPosition = (startTime: Date, endTime: Date) => {
    const startHour = Number(formatInTimeZone(startTime, timezone, "H"));
    const startMinute = Number(formatInTimeZone(startTime, timezone, "m"));
    const endHour = Number(formatInTimeZone(endTime, timezone, "H"));
    const endMinute = Number(formatInTimeZone(endTime, timezone, "m"));

    // Calculate top position: hour offset + minute fraction
    const top = (startHour - gridStartHour) * slotHeightPx + (startMinute / 60) * slotHeightPx;

    // Calculate height: hours + minutes
    const durationHours = endHour - startHour;
    const durationMinutes = endMinute - startMinute;
    const height = (durationHours + durationMinutes / 60) * slotHeightPx;

    return { top, height };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Plan na dziś</h3>
        <span className="text-xs text-muted-foreground">
          {format(today, "d MMMM yyyy", { locale: pl })}
        </span>
      </div>

      <div className="relative flex rounded-lg border bg-card">
        {/* Time column - hourly */}
        <div className="sticky left-0 z-10 w-12 flex-shrink-0 bg-background">
          {timeSlots.map((slot, index) => {
            return (
              <div
                key={index}
                className="relative border-r"
                style={{ height: `${slotHeightPx}px` }}
              >
                <div className="absolute -top-2 left-1 bg-background px-0.5 text-[10px] text-muted-foreground">
                  {formatTimeSlot(slot, timezone)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar grid - hourly */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="grid"
            style={{ gridTemplateRows: `repeat(${totalSlots}, ${slotHeightPx}px)` }}
          >
            {timeSlots.map((slot, index) => {
              return (
                <div
                  key={index}
                  className="border-b border-r border-t-2 border-t-border"
                />
              );
            })}
          </div>

          {/* Task slots overlay */}
          <div className="absolute inset-0">
            {todaySlots.map(({ slot, task, start, end }) => {
              const { top, height } = calculateHourlyPosition(start, end);
              const hasOverlap = slotsWithOverlap.has(slot.id);
              const minHeight = Math.max(height, 30); // Minimum height for readability

              return (
                <div
                  key={slot.id}
                  className={`absolute left-0 right-0 rounded border-2 overflow-hidden ${
                    task.priority === "high"
                      ? "bg-red-100 border-red-300 text-red-900"
                      : task.priority === "medium"
                        ? "bg-yellow-100 border-yellow-300 text-yellow-900"
                        : "bg-blue-100 border-blue-300 text-blue-900"
                  } ${hasOverlap ? "bg-stripes-red border-red-500" : ""}`}
                  style={{
                    top: `${top}px`,
                    height: `${minHeight}px`,
                    fontSize: "10px",
                    padding: "2px 4px",
                  }}
                  title={`${task.title}\n${task.description || ""}\nEstymacja: ${task.estimate_minutes}min`}
                >
                  <div className="flex items-center h-full">
                    <h4 className="font-medium text-[10px] leading-tight line-clamp-1 flex-1">
                      {task.title}
                    </h4>
                  </div>
                  {hasOverlap && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500 px-1 py-0.5 text-center text-[8px] font-medium text-white">
                      Konflikt
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {todaySlots.length === 0 && (
        <p className="text-center text-sm text-muted-foreground">Brak zaplanowanych zadań na dziś</p>
      )}
    </div>
  );
}
