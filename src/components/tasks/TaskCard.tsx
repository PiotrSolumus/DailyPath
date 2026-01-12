import { memo, useState } from "react";
import { Calendar, Clock, User, CalendarPlus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { PriorityBadge } from "../ui/priority-badge";
import { StatusBadge } from "../ui/status-badge";
import { PrivateTaskBadge } from "../ui/private-task-badge";
import { Button } from "../ui/button";
import { AddToPlanModal } from "./AddToPlanModal";
import type { TaskDTO } from "../../types";

interface TaskCardProps {
  /** Task data to display */
  task: TaskDTO;
  /** Callback when card is clicked (mouse or keyboard) */
  onClick?: () => void;
  /** Whether to show "assigned by" information (default: true) */
  showAssignedBy?: boolean;
  /** User ID for creating plan slots (required for "Add to Plan" button) */
  userId?: string;
}

/**
 * TaskCard component displays a single task in card format
 *
 * Features:
 * - Title, description, priority, status badges
 * - Privacy masking (shows "[Szczegóły prywatne]" when description is null for private tasks)
 * - Estimate in hours and minutes format
 * - Due date (conditional - only if set)
 * - ETA from plan slots (conditional - only if calculated, shown in green)
 * - Assigned by info (conditional - controlled by showAssignedBy prop)
 * - Interactive (clickable with mouse and keyboard)
 * - Accessibility: role="button", tabIndex, keyboard handlers
 *
 * Conditional Rendering:
 * - Description: shown only for non-private tasks OR when user has permission
 * - "[Szczegóły prywatne]": shown when task.is_private && task.description === null
 * - PrivateTaskBadge: shown only when task.is_private === true
 * - Due date: shown only when task.due_date is not null
 * - ETA: shown only when task.eta is not null (100% of estimate planned)
 * - Assigned by: shown only when showAssignedBy && task.assigned_by_user_id exists
 *
 * Performance:
 * - Memoized to prevent unnecessary re-renders when parent updates
 *
 * @example
 * ```tsx
 * <TaskCard
 *   task={taskDTO}
 *   onClick={() => handleTaskClick(taskDTO)}
 *   showAssignedBy={true}
 * />
 * ```
 */
export const TaskCard = memo(function TaskCard({ task, onClick, showAssignedBy = true, userId }: TaskCardProps) {
  const [showAddToPlan, setShowAddToPlan] = useState(false);

  // Build accessible label for screen readers
  const ariaLabel = `Zadanie: ${task.title}, priorytet ${task.priority}, status ${task.status}${task.is_private ? ", prywatne" : ""}`;

  const handleCardClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    // Don't trigger card click if clicking the "Add to Plan" button
    if ((e.target as HTMLElement).closest('[data-slot="button"]')) {
      return;
    }
    onClick?.();
  };

  return (
    <>
      <Card
        className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick(e);
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
                <dd className="text-muted-foreground">
                  Przypisane przez: {task.assigned_by_user_name ?? task.assigned_by_user_id}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>

        {userId && task.status !== "done" && (
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                setShowAddToPlan(true);
              }}
            >
              <CalendarPlus className="h-4 w-4" />
              Dodaj do planu
            </Button>
          </CardFooter>
        )}
      </Card>

      {userId && <AddToPlanModal task={task} open={showAddToPlan} onOpenChange={setShowAddToPlan} userId={userId} />}
    </>
  );
});
