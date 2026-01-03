import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "../ui/button";

interface CalendarControlsProps {
  currentDate: Date;
  view: "day" | "week";
  onViewChange: (view: "day" | "week") => void;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
}

export function CalendarControls({ currentDate, view, onViewChange, onNavigate, onToday }: CalendarControlsProps) {
  const dateLabel = format(currentDate, view === "day" ? "EEEE, d MMMM yyyy" : "'Tydzień' w, yyyy", { locale: pl });

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onNavigate("prev")} aria-label="Poprzedni">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onToday}>
            Dzisiaj
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("next")} aria-label="Następny">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Date label */}
        <h2 className="text-lg font-semibold capitalize">{dateLabel}</h2>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 rounded-lg border p-1">
        <Button
          variant={view === "day" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("day")}
        >
          Dzień
        </Button>
        <Button
          variant={view === "week" ? "default" : "ghost"}
          size="sm"
          onClick={() => onViewChange("week")}
        >
          Tydzień
        </Button>
      </div>
    </div>
  );
}

