import { useMemo } from "react";
import { getDaySlotsInTimeZone } from "../../lib/utils/time";
import { TimeSlot } from "./TimeSlot";

interface CalendarGridProps {
  date: Date;
  timezone: string;
  children?: React.ReactNode;
}

export function CalendarGrid({ date, timezone, children }: CalendarGridProps) {
  const timeSlots = useMemo(() => getDaySlotsInTimeZone(date, timezone), [date, timezone]);
  const totalSlots = timeSlots.length;

  return (
    <div className="relative flex">
      {/* Time column */}
      <div className="sticky left-0 z-10 w-20 flex-shrink-0 bg-background">
        {timeSlots.map((slot, index) => {
          const isHourStart = slot.getMinutes() === 0;
          if (!isHourStart) return null;

          return (
            <div key={index} className="relative h-40 border-r">
              {/* Time labels are in TimeSlot component */}
            </div>
          );
        })}
      </div>

      {/* Calendar grid */}
      <div className="relative flex-1">
        <div className="grid" style={{ gridTemplateRows: `repeat(${totalSlots}, minmax(40px, 1fr))` }}>
          {timeSlots.map((slot, index) => {
            const isHourStart = slot.getMinutes() === 0;

            return <TimeSlot key={index} time={slot} timezone={timezone} isHourStart={isHourStart} />;
          })}
        </div>

        {/* Task slots overlay */}
        <div className="absolute inset-0">{children}</div>
      </div>
    </div>
  );
}
