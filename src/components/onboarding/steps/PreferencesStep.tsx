import { Label } from "../../ui/label";

interface PreferencesData {
  defaultView: "day" | "week";
  notifications: boolean;
}

interface PreferencesStepProps {
  data: PreferencesData;
  onChange: (data: PreferencesData) => void;
}

export function PreferencesStep({ data, onChange }: PreferencesStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Domyślny widok kalendarza</Label>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
            <input
              type="radio"
              name="default-view"
              checked={data.defaultView === "day"}
              onChange={() => onChange({ ...data, defaultView: "day" })}
              className="h-4 w-4"
            />
            <div>
              <div className="font-medium">Widok dnia</div>
              <div className="text-sm text-muted-foreground">Zobacz szczegółowy plan pojedynczego dnia</div>
            </div>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
            <input
              type="radio"
              name="default-view"
              checked={data.defaultView === "week"}
              onChange={() => onChange({ ...data, defaultView: "week" })}
              className="h-4 w-4"
            />
            <div>
              <div className="font-medium">Widok tygodnia</div>
              <div className="text-sm text-muted-foreground">Zobacz plan całego tygodnia</div>
            </div>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Powiadomienia</Label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent">
          <input
            type="checkbox"
            checked={data.notifications}
            onChange={(e) => onChange({ ...data, notifications: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <div>
            <div className="font-medium">Włącz powiadomienia</div>
            <div className="text-sm text-muted-foreground">
              Otrzymuj powiadomienia o nadchodzących zadaniach i przekroczonych estymacjach
            </div>
          </div>
        </label>
      </div>

      <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-medium">Gotowe!</p>
        <p className="mt-1">Po kliknięciu "Zakończ" zostaniesz przekierowany do dashboardu.</p>
      </div>
    </div>
  );
}

