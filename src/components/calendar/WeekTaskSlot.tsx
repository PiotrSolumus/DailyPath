import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskSlot } from "./TaskSlot";
import { calculateSlotPosition, getWeekBoundaries } from "../../lib/utils/time";
import type { TaskDTO, PlanSlotDTO } from "../../types";

interface WeekTaskSlotProps {
  planSlot: PlanSlotDTO;
  task: TaskDTO;
  startTime: Date;
  endTime: Date;
  timezone: string;
  hasOverlap?: boolean;
  createdByManager?: boolean;
  onClick?: () => void;
  weekStartDate: Date;
}

export function WeekTaskSlot({
  planSlot,
  task,
  startTime,
  endTime,
  timezone,
  hasOverlap,
  createdByManager,
  onClick,
  weekStartDate,
}: WeekTaskSlotProps) {
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

  // Calculate which day of the week (0 = Monday, 6 = Sunday)
  const { start: weekStart } = getWeekBoundaries(weekStartDate);
  const dayOfWeek = Math.floor((startTime.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));

  // Each day column is 1/7 of the total width
  const columnWidth = 100 / 7;
  const leftPercent = dayOfWeek * columnWidth;

  const style = {
    top: `${position.top}px`,
    height: `${position.height}px`,
    left: `${leftPercent}%`,
    width: `${columnWidth}%`,
    ...(transform && {
      transform: CSS.Translate.toString(transform),
    }),
  };

  return (
    <div ref={setNodeRef} className="absolute px-1" style={style} {...attributes} {...listeners}>
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
