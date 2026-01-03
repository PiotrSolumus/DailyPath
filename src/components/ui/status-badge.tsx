import { Badge } from "./badge";
import type { Enums } from "../../db/database.types";

interface StatusBadgeProps {
  status: Enums<"task_status">;
}

const statusConfig = {
  todo: { label: "Do zrobienia", variant: "outline" as const },
  in_progress: { label: "W trakcie", variant: "info" as const },
  blocked: { label: "Zablokowane", variant: "warning" as const },
  done: { label: "Zakończone", variant: "success" as const },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

