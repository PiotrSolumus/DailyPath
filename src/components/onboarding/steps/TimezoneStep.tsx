import { Label } from "../../ui/label";
import { Select } from "../../ui/select";

interface TimezoneStepProps {
  timezone: string;
  onChange: (timezone: string) => void;
}

const commonTimezones = [
  { value: "Europe/Warsaw", label: "Europa/Warszawa (CET/CEST)" },
  { value: "Europe/London", label: "Europa/Londyn (GMT/BST)" },
  { value: "Europe/Berlin", label: "Europa/Berlin (CET/CEST)" },
  { value: "Europe/Paris", label: "Europa/Paryż (CET/CEST)" },
  { value: "America/New_York", label: "Ameryka/Nowy Jork (EST/EDT)" },
  { value: "America/Los_Angeles", label: "Ameryka/Los Angeles (PST/PDT)" },
  { value: "Asia/Tokyo", label: "Azja/Tokio (JST)" },
  { value: "UTC", label: "UTC" },
];

export function TimezoneStep({ timezone, onChange }: TimezoneStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="timezone">Strefa czasowa</Label>
        <Select id="timezone" value={timezone} onChange={(e) => onChange(e.target.value)}>
          {commonTimezones.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
        <p className="text-sm text-muted-foreground">
          Wybierz strefę czasową, w której pracujesz. Wszystkie godziny w aplikacji będą wyświetlane w tej strefie.
        </p>
      </div>

      <div className="rounded-lg border bg-muted p-4">
        <p className="text-sm">
          <strong>Aktualna godzina lokalna:</strong>
          <br />
          {new Date().toLocaleString("pl-PL", { timeZone: timezone, dateStyle: "full", timeStyle: "long" })}
        </p>
      </div>
    </div>
  );
}

