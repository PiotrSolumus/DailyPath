import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { getErrorMessage } from "../../lib/utils/error-messages";
import type { CreateTaskCommand } from "../../types";

interface CreateTaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

async function createTask(data: CreateTaskCommand): Promise<void> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

export function CreateTaskForm({ onSuccess, onCancel }: CreateTaskFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreateTaskCommand>({
    title: "",
    description: "",
    priority: "medium",
    estimate_minutes: 60,
    assigned_to_type: "user",
    is_private: false,
    due_date: null,
  });

  const mutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Zadanie zostało utworzone");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Convert empty description to null before submitting
    const dataToSubmit = {
      ...formData,
      description: formData.description.trim() || null,
    };
    mutation.mutate(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Nowe zadanie</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
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
