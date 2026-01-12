import { memo } from "react";
import { FileText, Code, Settings } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface RulePreviewProps {
  /** Rule file name */
  fileName: string;
  /** Rule content or description */
  content?: string;
  /** Rule type/category */
  type?: "frontend" | "backend" | "testing" | "general";
  /** Whether the rule is active */
  isActive?: boolean;
  /** Additional metadata */
  metadata?: {
    description?: string;
    globs?: string[];
    alwaysApply?: boolean;
  };
  /** Callback when rule is clicked */
  onClick?: () => void;
}

/**
 * RulePreview component displays a preview of a rule file
 *
 * Features:
 * - File name and type badge
 * - Content preview
 * - Metadata display (globs, alwaysApply flag)
 * - Active/inactive state
 * - Clickable card
 */
export const RulePreview = memo(function RulePreview({
  fileName,
  content,
  type = "general",
  isActive = true,
  metadata,
  onClick,
}: RulePreviewProps) {
  const getTypeIcon = () => {
    switch (type) {
      case "frontend":
        return <Code className="h-4 w-4" />;
      case "backend":
        return <Settings className="h-4 w-4" />;
      case "testing":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case "frontend":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "backend":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "testing":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card
      className={cn("transition-shadow hover:shadow-md", onClick && "cursor-pointer", !isActive && "opacity-60")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <CardTitle className="text-lg">{fileName}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={getTypeColor()}>{type}</Badge>
            {isActive && <Badge variant="outline">Active</Badge>}
            {metadata?.alwaysApply && <Badge variant="secondary">Always Apply</Badge>}
          </div>
        </div>
        {metadata?.description && <CardDescription>{metadata.description}</CardDescription>}
      </CardHeader>

      {content && (
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
            {content.substring(0, 200)}
            {content.length > 200 && "..."}
          </pre>
        </CardContent>
      )}

      {metadata?.globs && metadata.globs.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Globs:</span>
            {metadata.globs.map((glob, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {glob}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
});
