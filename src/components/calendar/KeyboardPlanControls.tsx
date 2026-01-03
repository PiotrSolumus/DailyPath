import { useState } from "react";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { Label } from "../ui/label";
import { Clock, MoveUp, MoveDown } from "lucide-react";
import { format } from "date-fns";
import type { PlanSlotDTO } from "../../types";

interface KeyboardPlanControlsProps {
  selectedSlot: PlanSlotDTO | null;
  onMove?: (slotId: string, newTime: Date) => Promise<void>;
}

export function KeyboardPlanControls({ selectedSlot, onMove }: KeyboardPlanControlsProps) {
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");

  if (!selectedSlot) {
    return (
      <div className="rounded-lg border bg-muted p-4 text-center text-sm text-muted-foreground">
        Wybierz slot zadania, aby użyć kontrolek klawiatury
      </div>
    );
  }

  const handleMove = () => {
    if (!onMove) return;

    const newTime = new Date();
    newTime.setHours(parseInt(selectedHour));
    newTime.setMinutes(parseInt(selectedMinute));
    newTime.setSeconds(0);
    newTime.setMilliseconds(0);

    onMove(selectedSlot.id, newTime);
  };

  const handleMoveBy = (minutes: number) => {
    if (!onMove) return;

    // Parse current slot time
    const match = selectedSlot.period.match(/\[([^,]+),/);
    if (!match) return;

    const currentTime = new Date(match[1]);
    const newTime = new Date(currentTime.getTime() + minutes * 60 * 1000);

    onMove(selectedSlot.id, newTime);
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Kontrolki klawiatury</h3>
      </div>

      <div className="space-y-4">
        {/* Quick move buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleMoveBy(-15)}
            aria-label="Przesuń 15 minut wcześniej"
          >
            <MoveUp className="mr-2 h-4 w-4" />
            -15 min
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleMoveBy(15)}
            aria-label="Przesuń 15 minut później"
          >
            <MoveDown className="mr-2 h-4 w-4" />
            +15 min
          </Button>
        </div>

        {/* Time picker */}
        <div className="space-y-2">
          <Label>Przenieś do godziny:</Label>
          <div className="flex gap-2">
            <Select
              value={selectedHour}
              onChange={(e) => setSelectedHour(e.target.value)}
              aria-label="Wybierz godzinę"
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i.toString().padStart(2, "0")}>
                  {i.toString().padStart(2, "0")}
                </option>
              ))}
            </Select>
            <span className="flex items-center">:</span>
            <Select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(e.target.value)}
              aria-label="Wybierz minuty"
            >
              {["00", "15", "30", "45"].map((min) => (
                <option key={min} value={min}>
                  {min}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={handleMove} className="w-full">
            Przenieś
          </Button>
        </div>
      </div>
    </div>
  );
}

