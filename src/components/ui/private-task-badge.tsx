import { Lock } from "lucide-react";
import { Badge } from "./badge";

export function PrivateTaskBadge() {
  return (
    <Badge variant="private" className="gap-1">
      <Lock className="h-3 w-3" />
      Prywatne
    </Badge>
  );
}

