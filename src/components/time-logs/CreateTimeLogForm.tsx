import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Spinner } from "../ui/spinner";
import type { TaskDTO } from "../../types";

interface CreateTimeLogFormProps {
  tasks: TaskDTO[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CreateTimeLogPayload {
  task_id: string;
  period: string;
}

async function createTimeLog(payload: CreateTimeLogPayload) {
  const response = await fetch("/api/time-logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create time log");
  }

  return response.json();
}

/**
 * Convert date and time inputs to PostgreSQL tstzrange format
 */
function createPeriod(date: string, startTime: string, duration: number): string {
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(start.getTime() + duration * 60 * 1000);

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  return `[${startISO},${endISO})`;
}

export function CreateTimeLogForm({ tasks, onSuccess, onCancel }: CreateTimeLogFormProps) {
  const queryClient = useQueryClient();

  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState(15); // in minutes

  const mutation = useMutation({
    mutationFn: createTimeLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskId) {
      alert("Wybierz zadanie");
      return;
    }

    const period = createPeriod(date, startTime, duration);

    mutation.mutate({
      task_id: taskId,
      period,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task">Zadanie</Label>
        <Select
          id="task"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          required
        >
          <option value="">Wybierz zadanie</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time">Godzina rozpoczęcia</Label>
          <Input
            id="start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            step="900" // 15 minutes
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Czas trwania (min)</Label>
          <Select
            id="duration"
            value={duration.toString()}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value="15">15 min</option>
            <option value="30">30 min</option>
            <option value="45">45 min</option>
            <option value="60">1 godz.</option>
            <option value="90">1.5 godz.</option>
            <option value="120">2 godz.</option>
            <option value="180">3 godz.</option>
            <option value="240">4 godz.</option>
            <option value="480">8 godz.</option>
          </Select>
        </div>
      </div>

      {mutation.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
          {mutation.error.message}
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Dodawanie...
            </>
          ) : (
            "Dodaj log czasu"
          )}
        </Button>
      </div>
    </form>
  );
}

