import { useState, useMemo, useEffect } from "react";
import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { CalendarControls } from "./CalendarControls";
import { CalendarGrid } from "./CalendarGrid";
import { WeekGrid } from "./WeekGrid";
import { DraggableTaskSlot } from "./DraggableTaskSlot";
import { WeekTaskSlot } from "./WeekTaskSlot";
import { navigateDay, navigateWeek, rangesOverlap, parsePgRange, getWeekBoundaries } from "../../lib/utils/time";
import { formatInTimeZone } from "date-fns-tz";
import type { PlanSlotDTO, TaskDTO } from "../../types";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "../ui/alert-dialog";

interface PlanCalendarProps {
  initialDate?: Date;
  planSlots: PlanSlotDTO[];
  tasks: TaskDTO[];
  timezone: string;
  onSlotMove?: (slotId: string, newStartTime: Date, allowOverlap: boolean) => Promise<void>;
  onDateChange?: (date: Date) => void;
  isManagerView?: boolean;
}

export function PlanCalendar({
  initialDate = new Date(),
  planSlots,
  tasks,
  timezone,
  onSlotMove,
  onDateChange,
  isManagerView = false,
}: PlanCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<"day" | "week">("day");

  // Sync internal state when initialDate changes from parent
  useEffect(() => {
    setCurrentDate(initialDate);
  }, [initialDate]);

  // Update internal state when date changes
  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };
  const [overlapDialog, setOverlapDialog] = useState<{
    open: boolean;
    slotId: string;
    newStartTime: Date;
  } | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Map tasks by ID for quick lookup
  const tasksById = useMemo(() => {
    return new Map(tasks.map((task) => [task.id, task]));
  }, [tasks]);

  // Check for overlaps
  const checkOverlap = (slotId: string, newStart: Date, duration: number): boolean => {
    const newEnd = new Date(newStart.getTime() + duration * 60 * 1000);

    return planSlots.some((slot) => {
      if (slot.id === slotId) return false; // Skip the slot being moved
      const { start, end } = parsePgRange(slot.period);
      return rangesOverlap({ start, end }, { start: newStart, end: newEnd });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !onSlotMove) return;

    const slotData = active.data.current as {
      planSlot: PlanSlotDTO;
      startTime: Date;
      endTime: Date;
    };

    const newStartTime = over.data.current?.time as Date;
    if (!newStartTime) return;

    const duration = Math.round((slotData.endTime.getTime() - slotData.startTime.getTime()) / (1000 * 60));

    // Check for overlaps
    const hasOverlap = checkOverlap(slotData.planSlot.id, newStartTime, duration);

    if (hasOverlap && !slotData.planSlot.allow_overlap) {
      // Show confirmation dialog
      setOverlapDialog({
        open: true,
        slotId: slotData.planSlot.id,
        newStartTime,
      });
    } else {
      // Move without confirmation
      onSlotMove(slotData.planSlot.id, newStartTime, false);
    }
  };

  const handleOverlapConfirm = async () => {
    if (!overlapDialog || !onSlotMove) return;

    await onSlotMove(overlapDialog.slotId, overlapDialog.newStartTime, true);
    setOverlapDialog(null);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    const newDate = view === "day" ? navigateDay(currentDate, direction) : navigateWeek(currentDate, direction);
    handleDateChange(newDate);
  };

  const handleToday = () => {
    handleDateChange(new Date());
  };

  return (
    <div className="space-y-4">
      <CalendarControls
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        onToday={handleToday}
        onDateSelect={handleDateChange}
      />

      <div className="rounded-lg border bg-card">
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          {view === "day" ? (
            <CalendarGrid date={currentDate} timezone={timezone}>
              {planSlots.map((slot) => {
                const task = tasksById.get(slot.task_id);
                if (!task) {
                  console.warn(`Task not found for slot ${slot.id}, task_id: ${slot.task_id}`);
                  return null;
                }

                const { start, end } = parsePgRange(slot.period);

                // Check if slot is in current day (in user's timezone)
                const slotDay = formatInTimeZone(start, timezone, "yyyy-MM-dd");
                const currentDay = formatInTimeZone(currentDate, timezone, "yyyy-MM-dd");
                if (slotDay !== currentDay) {
                  return null;
                }

                const hasOverlap = planSlots.some((other) => {
                  if (other.id === slot.id) return false;
                  const { start: otherStart, end: otherEnd } = parsePgRange(other.period);
                  return rangesOverlap({ start, end }, { start: otherStart, end: otherEnd });
                });

                return (
                  <DraggableTaskSlot
                    key={slot.id}
                    planSlot={slot}
                    task={task}
                    startTime={start}
                    endTime={end}
                    timezone={timezone}
                    hasOverlap={hasOverlap}
                    createdByManager={isManagerView}
                  />
                );
              })}
            </CalendarGrid>
          ) : (
            <WeekGrid date={currentDate} timezone={timezone}>
              {planSlots.map((slot) => {
                const task = tasksById.get(slot.task_id);
                if (!task) {
                  console.warn(`Task not found for slot ${slot.id}, task_id: ${slot.task_id}`);
                  return null;
                }

                const { start, end } = parsePgRange(slot.period);

                // Check if slot is in current week
                const { start: weekStart, end: weekEnd } = getWeekBoundaries(currentDate);
                
                if (start < weekStart || start >= weekEnd) {
                  return null;
                }

                const hasOverlap = planSlots.some((other) => {
                  if (other.id === slot.id) return false;
                  const { start: otherStart, end: otherEnd } = parsePgRange(other.period);
                  return rangesOverlap({ start, end }, { start: otherStart, end: otherEnd });
                });

                return (
                  <WeekTaskSlot
                    key={slot.id}
                    planSlot={slot}
                    task={task}
                    startTime={start}
                    endTime={end}
                    timezone={timezone}
                    hasOverlap={hasOverlap}
                    createdByManager={isManagerView}
                    weekStartDate={currentDate}
                  />
                );
              })}
            </WeekGrid>
          )}
        </DndContext>
      </div>

      {/* Overlap confirmation dialog */}
      <AlertDialog open={overlapDialog?.open ?? false} onOpenChange={(open) => !open && setOverlapDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Wykryto konflikt slotów</AlertDialogTitle>
            <AlertDialogDescription>
              Ten slot nakłada się z innym. Czy chcesz dopuścić ten konflikt? Oba sloty zostaną oznaczone wizualnie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOverlapDialog(null)}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleOverlapConfirm}>Dopuść konflikt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

