import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskSlot } from "./TaskSlot";
import type { TaskDTO, PlanSlotDTO } from "../../types";

interface DraggableTaskSlotProps {
  planSlot: PlanSlotDTO;
  task: TaskDTO;
  startTime: Date;
  endTime: Date;
  hasOverlap?: boolean;
  createdByManager?: boolean;
  onClick?: () => void;
}

export function DraggableTaskSlot({
  planSlot,
  task,
  startTime,
  endTime,
  hasOverlap,
  createdByManager,
  onClick,
}: DraggableTaskSlotProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: planSlot.id,
    data: {
      planSlot,
      task,
      startTime,
      endTime,
    },
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskSlot
        task={task}
        startTime={startTime}
        endTime={endTime}
        hasOverlap={hasOverlap}
        createdByManager={createdByManager}
        isDragging={isDragging}
        onClick={onClick}
      />
    </div>
  );
}

