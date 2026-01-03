import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlanCalendar } from "../calendar/PlanCalendar";
import { KeyboardPlanControls } from "../calendar/KeyboardPlanControls";
import { Spinner } from "../ui/spinner";
import { formatPgRange, formatDateForApi } from "../../lib/utils/time";
import { getErrorMessage } from "../../lib/utils/error-messages";
import type { PlanSlotDTO, TaskDTO } from "../../types";

interface PlanViewProps {
  userId: string;
  timezone: string;
  isManagerView?: boolean;
}

async function fetchPlanSlots(userId: string, startDate: string, endDate: string): Promise<PlanSlotDTO[]> {
  const params = new URLSearchParams({
    user_id: userId,
    start_date: startDate,
    end_date: endDate,
  });

  const response = await fetch(`/api/plan-slots?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch plan slots");
  }

  return response.json();
}

async function fetchTasks(): Promise<TaskDTO[]> {
  const response = await fetch("/api/tasks");

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

async function updatePlanSlot(slotId: string, newStartTime: Date, duration: number, allowOverlap: boolean): Promise<void> {
  const newEndTime = new Date(newStartTime.getTime() + duration * 60 * 1000);
  const period = formatPgRange(newStartTime, newEndTime);

  const response = await fetch(`/api/plan-slots/${slotId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period, allow_overlap: allowOverlap }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
}

export function PlanView({ userId, timezone, isManagerView = false }: PlanViewProps) {
  const [currentDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<PlanSlotDTO | null>(null);
  const queryClient = useQueryClient();

  // Fetch plan slots for current week
  const startDate = formatDateForApi(new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000));
  const endDate = formatDateForApi(new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000));

  const { data: planSlots, isLoading: planLoading } = useQuery({
    queryKey: ["plan-slots", userId, startDate, endDate],
    queryFn: () => fetchPlanSlots(userId, startDate, endDate),
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const moveMutation = useMutation({
    mutationFn: ({ slotId, newStartTime, duration, allowOverlap }: {
      slotId: string;
      newStartTime: Date;
      duration: number;
      allowOverlap: boolean;
    }) => updatePlanSlot(slotId, newStartTime, duration, allowOverlap),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
      toast.success("Slot został przesunięty");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSlotMove = async (slotId: string, newStartTime: Date, allowOverlap: boolean) => {
    const slot = planSlots?.find((s) => s.id === slotId);
    if (!slot) return;

    // Calculate duration from original slot
    const match = slot.period.match(/\[([^,]+),\s*([^)]+)\)/);
    if (!match) return;

    const start = new Date(match[1]);
    const end = new Date(match[2]);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));

    await moveMutation.mutateAsync({ slotId, newStartTime, duration, allowOverlap });
  };

  if (planLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
      <div>
        <PlanCalendar
          planSlots={planSlots ?? []}
          tasks={tasks ?? []}
          timezone={timezone}
          onSlotMove={handleSlotMove}
          isManagerView={isManagerView}
        />
      </div>

      <aside>
        <KeyboardPlanControls 
          selectedSlot={selectedSlot} 
          onMove={(slotId, newTime) => handleSlotMove(slotId, newTime, false)} 
        />
      </aside>
    </div>
  );
}

