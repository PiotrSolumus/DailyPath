import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface CalendarControlsProps {
  currentDate: Date;
  view: "day" | "week";
  onViewChange: (view: "day" | "week") => void;
  onNavigate: (direction: "prev" | "next") => void;
  onToday: () => void;
  onDateSelect?: (date: Date) => void;
}

export function CalendarControls({
  currentDate,
  view,
  onViewChange,
  onNavigate,
  onToday,
  onDateSelect,
}: CalendarControlsProps) {
  const [open, setOpen] = useState(false);
  const dateLabel = format(currentDate, view === "day" ? "EEEE, d MMMM yyyy" : "'Tydzień' w, yyyy", { locale: pl });

  const handleDateSelect = (date: Date | undefined) => {
    if (date && onDateSelect) {
      onDateSelect(date);
      setOpen(false);
    }
  };

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

        {/* Date label with picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-auto p-2 hover:bg-accent" aria-label="Wybierz datę">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <h2 className="text-lg font-semibold capitalize">{dateLabel}</h2>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={currentDate} onSelect={handleDateSelect} locale={pl} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* View switcher */}
      <div className="flex items-center gap-1 rounded-lg border p-1">
        <Button variant={view === "day" ? "default" : "ghost"} size="sm" onClick={() => onViewChange("day")}>
          Dzień
        </Button>
        <Button variant={view === "week" ? "default" : "ghost"} size="sm" onClick={() => onViewChange("week")}>
          Tydzień
        </Button>
      </div>
    </div>
  );
}
