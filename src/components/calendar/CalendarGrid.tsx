import { useMemo } from "react";
import { getDaySlots } from "../../lib/utils/time";
import { TimeSlot } from "./TimeSlot";

interface CalendarGridProps {
  date: Date;
  timezone: string;
  children?: React.ReactNode;
}

export function CalendarGrid({ date, timezone, children }: CalendarGridProps) {
  const timeSlots = useMemo(() => getDaySlots(date), [date]);

  return (
    <div className="relative">
      {/* Time column */}
      <div className="sticky left-0 z-10 w-20 bg-background">
        <div className="h-12" /> {/* Header spacer */}
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
      <div className="ml-20">
        <div className="grid" style={{ gridTemplateRows: "repeat(96, minmax(40px, 1fr))" }}>
          {timeSlots.map((slot, index) => {
            const isHourStart = slot.getMinutes() === 0;

            return (
              <TimeSlot
                key={index}
                time={slot}
                timezone={timezone}
                isHourStart={isHourStart}
              />
            );
          })}
        </div>

        {/* Task slots overlay */}
        <div className="absolute left-20 right-0 top-12">
          {children}
        </div>
      </div>
    </div>
  );
}

