import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, addMinutes, startOfDay, setHours, setMinutes } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { formatPgRange, roundTo15Min } from "../../lib/utils/time";
import { getErrorMessage } from "../../lib/utils/error-messages";
import type { TaskDTO } from "../../types";

interface AddToPlanModalProps {
  /** Task to add to plan */
  task: TaskDTO;
  /** Whether modal is open */
  open: boolean;
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void;
  /** User ID for whom to create the plan slot */
  userId: string;
}

interface CreatePlanSlotPayload {
  task_id: string;
  user_id: string;
  period: string;
  allow_overlap: boolean;
}

/**
 * Create a plan slot via API
 */
async function createPlanSlot(data: CreatePlanSlotPayload): Promise<void> {
  const response = await fetch("/api/plan-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

/**
 * AddToPlanModal component - modal for adding a task to the daily plan
 *
 * Features:
 * - Date picker (defaults to today)
 * - Time picker (defaults to next rounded 15-min slot)
 * - Duration auto-filled from task estimate
 * - Validation for 15-minute alignment
 * - Option to allow overlaps
 * - Integration with React Query for cache invalidation
 *
 * @example
 * ```tsx
 * <AddToPlanModal
 *   task={taskDTO}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   userId={currentUserId}
 * />
 * ```
 */
export function AddToPlanModal({ task, open, onOpenChange, userId }: AddToPlanModalProps) {
  // Initialize with today and next rounded 15-min slot
  const now = new Date();
  const roundedNow = roundTo15Min(addMinutes(now, 15));
  
  const [selectedDate, setSelectedDate] = useState<string>(format(now, "yyyy-MM-dd"));
  const [selectedTime, setSelectedTime] = useState<string>(format(roundedNow, "HH:mm"));
  const [duration, setDuration] = useState<number>(task.estimate_minutes);
  const [allowOverlap, setAllowOverlap] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createPlanSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
      // Invalidate all queries starting with "tasks" to refresh filtered lists
      queryClient.invalidateQueries({ 
        queryKey: ["tasks"],
        refetchType: "all"
      });
      toast.success("Zadanie zostało dodane do planu");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse date and time
    const [year, month, day] = selectedDate.split("-").map(Number);
    const [hours, minutes] = selectedTime.split(":").map(Number);

    // Create start date
    const startDate = new Date(year, month - 1, day, hours, minutes);

    // Validate 15-minute alignment
    if (startDate.getMinutes() % 15 !== 0) {
      toast.error("Godzina rozpoczęcia musi być wyrównana do 15 minut (np. 09:00, 09:15, 09:30, 09:45)");
      return;
    }

    // Validate duration
    if (duration < 15 || duration % 15 !== 0) {
      toast.error("Czas trwania musi być wielokrotnością 15 minut i wynosić co najmniej 15 minut");
      return;
    }

    // Calculate end date
    const endDate = addMinutes(startDate, duration);

    // Format as PostgreSQL tstzrange
    const period = formatPgRange(startDate, endDate);

    // Create payload
    const payload: CreatePlanSlotPayload = {
      task_id: task.id,
      user_id: userId,
      period,
      allow_overlap: allowOverlap,
    };

    // Submit
    createMutation.mutate(payload);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Generate time options (15-minute intervals)
  const timeOptions: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeOptions.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
    }
  }

  // Generate duration options (15-minute intervals from 15 to 480 minutes = 8 hours)
  const durationOptions: number[] = [];
  for (let d = 15; d <= 480; d += 15) {
    durationOptions.push(d);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj zadanie do planu</DialogTitle>
          <DialogDescription>
            Zaplanuj zadanie "{task.title}" w swoim kalendarzu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Date picker */}
            <div className="grid gap-2">
              <Label htmlFor="date">
                <CalendarIcon className="mr-2 inline h-4 w-4" />
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                min={format(new Date(), "yyyy-MM-dd")}
              />
            </div>

            {/* Time picker */}
            <div className="grid gap-2">
              <Label htmlFor="time">
                <Clock className="mr-2 inline h-4 w-4" />
                Godzina rozpoczęcia
              </Label>
              <select
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Godzina musi być wyrównana do 15 minut
              </p>
            </div>

            {/* Duration picker */}
            <div className="grid gap-2">
              <Label htmlFor="duration">
                <Clock className="mr-2 inline h-4 w-4" />
                Czas trwania
              </Label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>
                    {Math.floor(d / 60)}h {d % 60}min
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Estymacja zadania: {Math.floor(task.estimate_minutes / 60)}h {task.estimate_minutes % 60}min
              </p>
            </div>

            {/* Allow overlap checkbox */}
            <div className="flex items-center gap-2">
              <input
                id="allow-overlap"
                type="checkbox"
                checked={allowOverlap}
                onChange={(e) => setAllowOverlap(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="allow-overlap" className="cursor-pointer text-sm font-normal">
                Pozwól na nakładanie się z innymi zadaniami
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Anuluj
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Dodawanie..." : "Dodaj do planu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

