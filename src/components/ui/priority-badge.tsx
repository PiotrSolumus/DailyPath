import { Badge } from "./badge";
import type { Enums } from "../../db/database.types";

interface PriorityBadgeProps {
  priority: Enums<"task_priority">;
}

const priorityConfig = {
  low: { label: "Niski", variant: "info" as const },
  medium: { label: "Średni", variant: "warning" as const },
  high: { label: "Wysoki", variant: "destructive" as const },
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority as keyof typeof priorityConfig];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

