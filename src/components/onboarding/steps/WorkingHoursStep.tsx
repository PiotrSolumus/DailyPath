import { Label } from "../../ui/label";
import { Select } from "../../ui/select";

interface WorkingHoursData {
  days: number[];
  startHour: number;
  endHour: number;
}

interface WorkingHoursStepProps {
  data: WorkingHoursData;
  onChange: (data: WorkingHoursData) => void;
}

const dayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

export function WorkingHoursStep({ data, onChange }: WorkingHoursStepProps) {
  const toggleDay = (day: number) => {
    const newDays = data.days.includes(day) ? data.days.filter((d) => d !== day) : [...data.days, day].sort();

    onChange({ ...data, days: newDays });
  };

  return (
    <div className="space-y-6">
      {/* Days selection */}
      <div className="space-y-3">
        <Label>Dni pracy</Label>
        <div className="space-y-2">
          {dayNames.map((name, index) => {
            const dayValue = index + 1;
            return (
              <label
                key={dayValue}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={data.days.includes(dayValue)}
                  onChange={() => toggleDay(dayValue)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span>{name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Hours selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="start-hour">Godzina rozpoczęcia</Label>
          <Select
            id="start-hour"
            value={data.startHour.toString()}
            onChange={(e) => onChange({ ...data, startHour: parseInt(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}:00
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end-hour">Godzina zakończenia</Label>
          <Select
            id="end-hour"
            value={data.endHour.toString()}
            onChange={(e) => onChange({ ...data, endHour: parseInt(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {i.toString().padStart(2, "0")}:00
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Te ustawienia będą używane do obliczania wskaźnika wypełnienia planu (plan_filled_%).
      </p>
    </div>
  );
}
