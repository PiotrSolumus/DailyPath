import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { getErrorMessage } from "../../lib/utils/error-messages";
import { useAuth } from "../../lib/contexts/AuthContext";
import { AssigneeSelector } from "./AssigneeSelector";
import type { TaskDTO, UpdateTaskCommand } from "../../types";

interface EditTaskFormProps {
  /** Task to edit */
  task: TaskDTO;
  /** Callback after successful task update (e.g., close modal) */
  onSuccess?: () => void;
  /** Callback when user cancels (e.g., close modal) */
  onCancel?: () => void;
}

/**
 * Update an existing task via API
 * PATCHes to /api/tasks/:id with UpdateTaskCommand payload
 * @throws {Error} When API request fails
 */
async function updateTask(taskId: string, data: UpdateTaskCommand): Promise<void> {
  const response = await fetch(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

/**
 * EditTaskForm component - form for editing existing tasks
 * 
 * Features:
 * - All fields editable: title, description, priority, status, estimate, due_date, is_private
 * - HTML5 validation (required, min, step for estimate)
 * - Backend validation via Zod schema on API
 * - React Query mutation for optimistic updates
 * - Toast notifications (success/error)
 * - Automatic cache invalidation on success
 * - Empty description converted to null before submit
 * 
 * Validation:
 * - Title: required (HTML5)
 * - Priority: required, one of "low", "medium", "high"
 * - Status: required, one of "todo", "in_progress", "blocked", "done"
 * - Estimate: required, min 15, step 15 (must be multiple of 15)
 * - Due date: optional ISO date string
 * - Is private: boolean checkbox
 * 
 * Performance:
 * - Submit handler memoized with useCallback
 * 
 * @example
 * ```tsx
 * <EditTaskForm 
 *   task={taskDTO}
 *   onSuccess={() => setModalOpen(false)}
 *   onCancel={() => setModalOpen(false)}
 * />
 * ```
 */
export function EditTaskForm({ task, onSuccess, onCancel }: EditTaskFormProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [formData, setFormData] = useState<UpdateTaskCommand>({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    estimate_minutes: task.estimate_minutes,
    is_private: task.is_private,
    due_date: task.due_date,
    assigned_to_type: task.assigned_to_type,
    assigned_user_id: task.assigned_user_id,
    assigned_department_id: task.assigned_department_id,
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateTaskCommand) => updateTask(task.id, data),
    onSuccess: () => {
      // Invalidate all queries starting with "tasks" to refresh filtered lists
      queryClient.invalidateQueries({ 
        queryKey: ["tasks"],
        refetchType: "all"
      });
      toast.success("Zadanie zostało zaktualizowane");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Memoize submit handler
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      // Convert empty description to null
      const payload: UpdateTaskCommand = {
        ...formData,
        description: formData.description?.trim() === "" ? null : formData.description,
      };

      mutation.mutate(payload);
    },
    [formData, mutation]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Edytuj zadanie</DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">
            Tytuł <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            maxLength={255}
            placeholder="Nazwa zadania"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Opis</Label>
          <textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            maxLength={5000}
            rows={4}
            placeholder="Szczegółowy opis zadania"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">
              Priorytet <span className="text-destructive">*</span>
            </Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as "low" | "medium" | "high" })}
              required
            >
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "todo" | "in_progress" | "blocked" | "done" })}
              required
            >
              <option value="todo">Do zrobienia</option>
              <option value="in_progress">W trakcie</option>
              <option value="blocked">Zablokowane</option>
              <option value="done">Wykonane</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="estimate">
              Estymacja (minuty) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="estimate"
              type="number"
              value={formData.estimate_minutes}
              onChange={(e) => setFormData({ ...formData, estimate_minutes: Number(e.target.value) })}
              required
              min={15}
              step={15}
              placeholder="60"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due-date">Termin</Label>
            <Input
              id="due-date"
              type="date"
              value={formData.due_date || ""}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value || null })}
            />
          </div>
        </div>

        <AssigneeSelector
          assignedToType={formData.assigned_to_type || task.assigned_to_type}
          assignedUserId={formData.assigned_user_id ?? task.assigned_user_id}
          assignedDepartmentId={formData.assigned_department_id ?? task.assigned_department_id}
          onChange={(type, id) => {
            if (type === "user") {
              setFormData({ ...formData, assigned_to_type: type, assigned_user_id: id, assigned_department_id: null });
            } else {
              setFormData({ ...formData, assigned_to_type: type, assigned_department_id: id, assigned_user_id: null });
            }
          }}
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
            aria-describedby="private-hint"
          />
          <Label htmlFor="is-private" className="cursor-pointer">
            Zadanie prywatne
          </Label>
          <span id="private-hint" className="sr-only">
            Prywatne zadania są widoczne tylko dla właściciela i menedżerów działu
          </span>
        </div>
      </div>

      <DialogFooter>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuluj
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </DialogFooter>
    </form>
  );
}

