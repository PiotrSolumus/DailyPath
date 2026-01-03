import { Calendar, Clock, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { PriorityBadge } from "../ui/priority-badge";
import { StatusBadge } from "../ui/status-badge";
import { PrivateTaskBadge } from "../ui/private-task-badge";
import type { TaskDTO } from "../../types";

interface TaskCardProps {
  task: TaskDTO;
  onClick?: () => void;
  showAssignedBy?: boolean;
}

export function TaskCard({ task, onClick, showAssignedBy = true }: TaskCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg">{task.title}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
            {task.is_private && <PrivateTaskBadge />}
          </div>
        </div>
        {task.description && !task.is_private && (
          <CardDescription className="line-clamp-2">{task.description}</CardDescription>
        )}
        {task.is_private && task.description === null && (
          <CardDescription className="italic text-muted-foreground">[Szczegóły prywatne]</CardDescription>
        )}
      </CardHeader>

      <CardContent>
        <dl className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <dt className="sr-only">Estymacja</dt>
            <dd>
              Estymacja: {Math.floor(task.estimate_minutes / 60)}h {task.estimate_minutes % 60}min
            </dd>
          </div>

          {task.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <dt className="sr-only">Termin</dt>
              <dd>Termin: {format(parseISO(task.due_date), "d MMMM yyyy", { locale: pl })}</dd>
            </div>
          )}

          {task.eta && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <dt className="sr-only">ETA</dt>
              <dd className="font-medium text-green-600">
                ETA: {format(parseISO(task.eta), "d MMMM yyyy, HH:mm", { locale: pl })}
              </dd>
            </div>
          )}

          {showAssignedBy && task.assigned_by_user_id && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <dt className="sr-only">Przypisane przez</dt>
              <dd className="text-muted-foreground">Przypisane przez: {task.assigned_by_user_id}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

