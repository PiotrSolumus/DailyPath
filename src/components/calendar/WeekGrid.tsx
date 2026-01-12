import { useMemo } from "react";
import { addDays, format } from "date-fns";
import { pl } from "date-fns/locale";
import { getWeekBoundaries, getDaySlotsInTimeZone } from "../../lib/utils/time";
import { TimeSlot } from "./TimeSlot";
import { cn } from "../../lib/utils";

interface WeekGridProps {
  date: Date;
  timezone: string;
  children?: React.ReactNode;
}

export function WeekGrid({ date, timezone, children }: WeekGridProps) {
  const { start: weekStart } = useMemo(() => getWeekBoundaries(date), [date]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const timeSlots = useMemo(() => getDaySlotsInTimeZone(weekStart, timezone), [weekStart, timezone]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative overflow-x-auto">
      {/* Header with day names */}
      <div className="sticky top-0 z-20 flex bg-background">
        <div className="w-20 flex-shrink-0 border-b border-r" /> {/* Time column header */}
        {weekDays.map((day) => {
          const isToday = day.getTime() === today.getTime();
          return (
            <div
              key={day.toISOString()}
              className={cn("flex-1 border-b border-r p-2 text-center", isToday && "bg-primary/10 font-semibold")}
            >
              <div className="text-xs uppercase text-muted-foreground">{format(day, "EEE", { locale: pl })}</div>
              <div className={cn("text-lg", isToday && "text-primary")}>{format(day, "d")}</div>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="flex">
        {/* Time column */}
        <div className="sticky left-0 z-10 w-20 flex-shrink-0 bg-background">
          {timeSlots.map((slot, index) => {
            const isHourStart = slot.getMinutes() === 0;
            if (!isHourStart) return null;

            return (
              <div key={index} className="relative h-40 border-r">
                <div className="sticky top-14 bg-background px-1 py-1 text-xs text-muted-foreground">
                  {format(slot, "HH:mm")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const daySlots = getDaySlotsInTimeZone(day, timezone);
          const isToday = day.getTime() === today.getTime();

          return (
            <div key={day.toISOString()} className={cn("relative flex-1", isToday && "bg-primary/5")}>
              {daySlots.map((slot, index) => {
                const isHourStart = slot.getMinutes() === 0;

                return <TimeSlot key={index} time={slot} timezone={timezone} isHourStart={isHourStart} />;
              })}
            </div>
          );
        })}
      </div>

      {/* Task slots overlay */}
      <div className="pointer-events-none absolute left-20 right-0 top-14">{children}</div>
    </div>
  );
}
