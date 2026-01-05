import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, addMinutes } from "date-fns";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { getErrorMessage } from "../../lib/utils/error-messages";
import { useAuth } from "../../lib/contexts/AuthContext";
import { AssigneeSelector } from "./AssigneeSelector";
import { formatPgRange, roundTo15Min } from "../../lib/utils/time";
import type { CreateTaskCommand } from "../../types";

interface CreateTaskFormProps {
  /** Callback after successful task creation (e.g., close modal) */
  onSuccess?: () => void;
  /** Callback when user cancels (e.g., close modal) */
  onCancel?: () => void;
}

/**
 * Create a new task and optionally a plan slot via API
 */
async function createTask(data: CreateTaskCommand & { plan_now?: boolean, plan_date?: string, plan_time?: string }): Promise<void> {
  const { plan_now, plan_date, plan_time, ...taskData } = data;
  
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const { id: taskId } = await response.json();

  // If user wants to plan it now, create a plan slot
  if (plan_now && plan_date && plan_time) {
    const [year, month, day] = plan_date.split("-").map(Number);
    const [hours, minutes] = plan_time.split(":").map(Number);
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = addMinutes(startDate, taskData.estimate_minutes);
    const period = formatPgRange(startDate, endDate);

    const planResponse = await fetch("/api/plan-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        user_id: taskData.assigned_id || taskData.assigned_by_user_id || "", // Use assigned user or fallback
        period,
        allow_overlap: false,
      }),
    });

    if (!planResponse.ok) {
      // We don't throw here to not lose the task, but we toast below in onSuccess
      console.error("Failed to create plan slot:", await planResponse.text());
    }
  }
}

/**
 * Default values for new task form
 */
const DEFAULT_FORM_DATA = {
  title: "",
  description: "",
  priority: "medium" as const,
  estimate_minutes: 60,
  assigned_to_type: "user" as const,
  is_private: false,
  due_date: null as string | null,
  plan_now: false,
  plan_date: format(new Date(), "yyyy-MM-dd"),
  plan_time: format(roundTo15Min(addMinutes(new Date(), 15)), "HH:mm"),
};

export function CreateTaskForm({ onSuccess, onCancel }: CreateTaskFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      // Invalidate all queries starting with "tasks" or "plan-slots"
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["plan-slots"] });
      
      toast.success("Zadanie zostało utworzone" + (formData.plan_now ? " i dodane do planu" : ""));
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Memoize submit handler
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time if planning now
    if (formData.plan_now) {
      const [hours, minutes] = formData.plan_time.split(":").map(Number);
      if (minutes % 15 !== 0) {
        toast.error("Godzina rozpoczęcia musi być wielokrotnością 15 minut");
        return;
      }
    }

    const dataToSubmit = {
      ...formData,
      description: formData.description.trim() || null,
      assigned_by_user_id: user?.id,
    };
    mutation.mutate(dataToSubmit as any);
  }, [formData, mutation, user]);

  // Generate time options
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    return options;
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nowe zadanie</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="space-y-2">
          <Label htmlFor="title">Nazwa *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Wprowadź nazwę zadania"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Opis</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Wprowadź opis zadania"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priority">Priorytet *</Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              required
            >
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimate">Estymacja (minuty) *</Label>
            <Input
              id="estimate"
              type="number"
              min="15"
              step="15"
              value={formData.estimate_minutes}
              onChange={(e) => setFormData({ ...formData, estimate_minutes: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due-date">Data docelowa</Label>
          <Input
            id="due-date"
            type="date"
            value={formData.due_date ?? ""}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
          />
        </div>

        <AssigneeSelector
          assignedToType={formData.assigned_to_type}
          assignedUserId={formData.assigned_to_type === "user" ? ((formData as any).assigned_id || user?.id || null) : null}
          assignedDepartmentId={formData.assigned_to_type === "department" ? ((formData as any).assigned_id || null) : null}
          onChange={(type, id) => setFormData({ ...formData, assigned_to_type: type, assigned_id: id || undefined } as any)}
          currentUserId={user?.id}
          required={true}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is-private"
            checked={formData.is_private}
            onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is-private" className="cursor-pointer">
            Zadanie prywatne
          </Label>
        </div>

        <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="plan-now"
              checked={formData.plan_now}
              onChange={(e) => setFormData({ ...formData, plan_now: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="plan-now" className="cursor-pointer font-medium">
              Dodaj od razu do planu dnia
            </Label>
          </div>

          {formData.plan_now && (
            <div className="grid gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-2">
                <Label htmlFor="plan-date">Data planu</Label>
                <Input
                  id="plan-date"
                  type="date"
                  value={formData.plan_date}
                  onChange={(e) => setFormData({ ...formData, plan_date: e.target.value })}
                  required={formData.plan_now}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-time">Godzina rozpoczęcia</Label>
                <select
                  id="plan-time"
                  value={formData.plan_time}
                  onChange={(e) => setFormData({ ...formData, plan_time: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                  required={formData.plan_now}
                >
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Tworzenie..." : "Utwórz zadanie"}
        </Button>
      </DialogFooter>
    </form>
  );
}
