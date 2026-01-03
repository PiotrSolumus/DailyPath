import { cn } from "../../lib/utils";
import { formatTimeSlot } from "../../lib/utils/time";

interface TimeSlotProps {
  time: Date;
  timezone: string;
  isHourStart: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function TimeSlot({ time, timezone, isHourStart, isSelected, onClick, children }: TimeSlotProps) {
  return (
    <div
      className={cn(
        "relative min-h-[40px] border-b border-r transition-colors",
        isHourStart ? "border-t-2 border-t-border" : "border-t border-t-border/30",
        isSelected && "bg-accent",
        onClick && "cursor-pointer hover:bg-accent/50",
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {isHourStart && (
        <div className="absolute -top-3 left-2 bg-background px-1 text-xs text-muted-foreground">
          {formatTimeSlot(time, timezone)}
        </div>
      )}
      {children}
    </div>
  );
}

