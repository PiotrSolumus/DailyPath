import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Filter } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";
import { TimeLogList } from "./TimeLogList";
import { CreateTimeLogForm } from "./CreateTimeLogForm";
import type { TaskDTO, TimeLogDTO } from "../../types";

interface TimeLogsViewProps {
  initialFilters?: {
    start_date?: string;
    end_date?: string;
  };
}

async function fetchTasks(): Promise<TaskDTO[]> {
  const response = await fetch("/api/tasks");

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

async function deleteTimeLog(timeLogId: string) {
  const response = await fetch(`/api/time-logs/${timeLogId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete time log");
  }

  return response.json();
}

export function TimeLogsView({ initialFilters }: TimeLogsViewProps) {
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState(initialFilters?.start_date || "");
  const [endDate, setEndDate] = useState(initialFilters?.end_date || "");

  // Fetch available tasks for the create form
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTimeLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
    },
  });

  const handleDelete = (timeLogId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten log czasu?")) {
      deleteMutation.mutate(timeLogId);
    }
  };

  const filters: Record<string, string | undefined> = {
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Czas pracy</h1>
          <p className="text-muted-foreground">Rejestruj i zarządzaj swoim czasem pracy</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtruj
          </Button>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj log czasu
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filtruj po dacie
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Data początkowa</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">Data końcowa</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Dodaj nowy log czasu</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateTimeLogForm
              tasks={tasks}
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Delete error */}
      {deleteMutation.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {deleteMutation.error.message}
        </div>
      )}

      {/* Time logs list */}
      <TimeLogList filters={filters} onDelete={handleDelete} />
    </div>
  );
}

