import { useDroppable } from "@dnd-kit/core";
import { TimeSlot } from "./TimeSlot";
import { cn } from "../../lib/utils";

interface DroppableTimeSlotProps {
  slotId: string;
  time: Date;
  timezone: string;
  isHourStart: boolean;
  isOccupied?: boolean;
}

export function DroppableTimeSlot({ slotId, time, timezone, isHourStart, isOccupied }: DroppableTimeSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { time },
  });

  return (
    <div ref={setNodeRef} className={cn(isOver && !isOccupied && "ring-2 ring-primary ring-inset")}>
      <TimeSlot time={time} timezone={timezone} isHourStart={isHourStart} isSelected={isOver} />
    </div>
  );
}

