import { Clock, Trash2, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import type { TimeLogDTO } from "../../types";

interface TimeLogCardProps {
  timeLog: TimeLogDTO;
  onEdit?: (timeLog: TimeLogDTO) => void;
  onDelete?: (timeLogId: string) => void;
}

/**
 * Parse PostgreSQL tstzrange string to start and end dates
 * Format: "[2024-01-01 10:00:00+00,2024-01-01 10:15:00+00)"
 */
function parsePeriod(period: string): { start: Date; end: Date; minutes: number } {
  const match = period.match(/\[(.*?),(.*?)\)/);
  if (!match) {
    throw new Error("Invalid period format");
  }

  const start = new Date(match[1]);
  const end = new Date(match[2]);
  const minutes = (end.getTime() - start.getTime()) / (1000 * 60);

  return { start, end, minutes };
}

/**
 * Format date to human-readable string
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Format minutes to human-readable duration
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins} min`;
  }

  if (mins === 0) {
    return `${hours} godz.`;
  }

  return `${hours} godz. ${mins} min`;
}

/**
 * Check if the time log can be edited (within last 7 days)
 */
function canEdit(endDate: Date): boolean {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  return endDate >= sevenDaysAgo;
}

export function TimeLogCard({ timeLog, onEdit, onDelete }: TimeLogCardProps) {
  const { start, end, minutes } = parsePeriod(timeLog.period);
  const editable = canEdit(end);

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Clock className="h-5 w-5 text-primary" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{formatDuration(minutes)}</span>
              {!editable && <span className="text-xs text-muted-foreground">(nie można edytować)</span>}
            </div>
            <div className="text-sm text-muted-foreground">
              <div>
                {formatDate(start)} - {formatDate(end)}
              </div>
            </div>
          </div>
        </div>

        {editable && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(timeLog)} aria-label="Edytuj log czasu">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(timeLog.id)} aria-label="Usuń log czasu">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
