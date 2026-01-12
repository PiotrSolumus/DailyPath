import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskSlot } from "./TaskSlot";
import { calculateSlotPosition } from "../../lib/utils/time";
import type { TaskDTO, PlanSlotDTO } from "../../types";

interface DraggableTaskSlotProps {
  planSlot: PlanSlotDTO;
  task: TaskDTO;
  startTime: Date;
  endTime: Date;
  timezone: string;
  hasOverlap?: boolean;
  createdByManager?: boolean;
  onClick?: () => void;
}

export function DraggableTaskSlot({
  planSlot,
  task,
  startTime,
  endTime,
  timezone,
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

  // Calculate position in the calendar grid
  const position = calculateSlotPosition(startTime, endTime, 6, 40, timezone);

  const style = {
    top: `${position.top}px`,
    height: `${position.height}px`,
    ...(transform && {
      transform: CSS.Translate.toString(transform),
    }),
  };

  return (
    <div ref={setNodeRef} className="absolute left-0 right-0" style={style} {...attributes} {...listeners}>
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
