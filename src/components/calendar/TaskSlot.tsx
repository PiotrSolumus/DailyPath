import { GripVertical, Crown } from "lucide-react";
import { cn } from "../../lib/utils";
import type { TaskDTO } from "../../types";
import { PriorityBadge } from "../ui/priority-badge";
import { PrivateTaskBadge } from "../ui/private-task-badge";

interface TaskSlotProps {
  task: TaskDTO;
  startTime: Date;
  endTime: Date;
  hasOverlap?: boolean;
  createdByManager?: boolean;
  isDragging?: boolean;
  onDragStart?: () => void;
  onClick?: () => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 border-blue-300 text-blue-900",
  medium: "bg-yellow-100 border-yellow-300 text-yellow-900",
  high: "bg-red-100 border-red-300 text-red-900",
};

export function TaskSlot({
  task,
  startTime,
  endTime,
  hasOverlap,
  createdByManager,
  isDragging,
  onDragStart,
  onClick,
}: TaskSlotProps) {
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const isShort = durationMinutes <= 30;

  return (
    <div
      className={cn(
        "group absolute left-0 right-0 rounded-md border-2 p-2 shadow-sm transition-all",
        priorityColors[task.priority] || priorityColors.medium,
        hasOverlap && "bg-stripes-red border-red-500",
        isDragging && "opacity-50",
        onClick && "cursor-pointer hover:shadow-md",
      )}
      onClick={onClick}
      title={`${task.title}\n${task.description || ""}\nEstymacja: ${task.estimate_minutes}min`}
    >
      {/* Manager badge */}
      {createdByManager && (
        <div className="absolute right-1 top-1">
          <Crown className="h-3 w-3 text-purple-600" />
        </div>
      )}

      {/* Drag handle */}
      {onDragStart && (
        <button
          className="absolute left-1 top-1 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          onMouseDown={onDragStart}
          aria-label="Przeciągnij zadanie"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Task content */}
      <div className={cn("space-y-1", isShort && "flex items-center gap-2")}>
        <div className="flex items-start justify-between gap-2">
          <h4 className={cn("font-medium", isShort ? "text-xs" : "text-sm")}>{task.title}</h4>
        </div>

        {!isShort && (
          <>
            {task.description && !task.is_private && (
              <p className="line-clamp-2 text-xs opacity-80">{task.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-1">
              <PriorityBadge priority={task.priority} />
              {task.is_private && <PrivateTaskBadge />}
            </div>
          </>
        )}
      </div>

      {/* Overlap indicator */}
      {hasOverlap && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-500 px-2 py-0.5 text-center text-xs font-medium text-white">
          Konflikt
        </div>
      )}
    </div>
  );
}

