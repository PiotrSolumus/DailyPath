/**
 * Rules Builder Service
 *
 * Generates business rules content for the DailyPath application.
 * Handles validation rules, business logic constraints, and rule formatting.
 */

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  category: "time" | "planning" | "task" | "permission" | "time-log";
  severity: "error" | "warning" | "info";
  condition: string;
  action: string;
}

export interface RulesBuilderOptions {
  includeTimeRules?: boolean;
  includePlanningRules?: boolean;
  includeTaskRules?: boolean;
  includePermissionRules?: boolean;
  includeTimeLogRules?: boolean;
  format?: "markdown" | "json" | "plain";
  includeMetadata?: boolean;
}

/**
 * Rules Builder Service
 * Generates formatted business rules content based on provided options
 */
export class RulesBuilderService {
  private static readonly DEFAULT_RULES: BusinessRule[] = [
    // Time validation rules
    {
      id: "time-001",
      name: "15-Minute Alignment",
      description: "All time periods must be aligned to 15-minute intervals",
      category: "time",
      severity: "error",
      condition: "Time period start/end minutes not in [0, 15, 30, 45]",
      action: "Round to nearest 15-minute interval",
    },
    {
      id: "time-002",
      name: "Positive Duration",
      description: "Time period duration must be greater than zero",
      category: "time",
      severity: "error",
      condition: "period.end <= period.start",
      action: "Reject period creation",
    },

    // Planning rules
    {
      id: "planning-001",
      name: "Overlap Prevention",
      description: "Plan slots cannot overlap unless explicitly allowed",
      category: "planning",
      severity: "error",
      condition: "New slot overlaps existing slot AND allow_overlap = false",
      action: "Return 409 Conflict with suggest_overlap flag",
    },
    {
      id: "planning-002",
      name: "Future Planning Only",
      description: "Plan slots can only be created for future dates",
      category: "planning",
      severity: "warning",
      condition: "slot.period.start < current_date",
      action: "Allow but show warning",
    },

    // Task rules
    {
      id: "task-001",
      name: "Private Task Masking",
      description: "Private task descriptions are masked for non-assigned users",
      category: "task",
      severity: "info",
      condition: "task.is_private = true AND user not assigned AND user not manager of department",
      action: "Mask description with placeholder text",
    },
    {
      id: "task-002",
      name: "Estimate Minimum",
      description: "Task estimates must be at least 15 minutes",
      category: "task",
      severity: "error",
      condition: "estimate_minutes < 15",
      action: "Reject task creation",
    },
    {
      id: "task-003",
      name: "Estimate Multiple of 15",
      description: "Task estimates must be multiples of 15 minutes",
      category: "task",
      severity: "error",
      condition: "estimate_minutes % 15 !== 0",
      action: "Round to nearest multiple of 15",
    },

    // Permission rules
    {
      id: "permission-001",
      name: "Admin Full Access",
      description: "Admin role has full access to all organizational data",
      category: "permission",
      severity: "info",
      condition: 'user.app_role = "admin"',
      action: "Grant full access to departments, memberships, and all tasks",
    },
    {
      id: "permission-002",
      name: "Manager Department Access",
      description: "Managers can plan slots for users in their department",
      category: "permission",
      severity: "info",
      condition: 'user.app_role = "manager" AND target_user.department_id = user.department_id',
      action: "Allow slot creation for department members",
    },
    {
      id: "permission-003",
      name: "Employee Self-Only",
      description: "Employees can only plan slots for themselves",
      category: "permission",
      severity: "error",
      condition: 'user.app_role = "employee" AND slot.user_id !== user.id',
      action: "Reject slot creation",
    },

    // Time log rules
    {
      id: "time-log-001",
      name: "7-Day Edit Limit",
      description: "Time logs can only be edited or deleted within 7 days",
      category: "time-log",
      severity: "error",
      condition: "time_log.date < current_date - 7 days",
      action: "Reject update/delete operations",
    },
    {
      id: "time-log-002",
      name: "Task Assignment Validation",
      description: "Users can only log time for assigned tasks",
      category: "time-log",
      severity: "error",
      condition: "task.assigned_user_id !== user.id AND task.assigned_department_id !== user.department_id",
      action: "Reject time log creation",
    },
  ];

  /**
   * Generates rules content based on provided options
   *
   * @param options - Configuration options for rule generation
   * @returns Formatted rules content string
   *
   * @example
   * ```ts
   * const service = new RulesBuilderService();
   * const content = service.generateRulesContent({
   *   includeTimeRules: true,
   *   format: 'markdown',
   *   includeMetadata: true
   * });
   * ```
   */
  generateRulesContent(options: RulesBuilderOptions = {}): string {
    const {
      includeTimeRules = true,
      includePlanningRules = true,
      includeTaskRules = true,
      includePermissionRules = true,
      includeTimeLogRules = true,
      format = "markdown",
      includeMetadata = false,
    } = options;

    // Filter rules based on options
    const filteredRules = this.filterRules({
      includeTimeRules,
      includePlanningRules,
      includeTaskRules,
      includePermissionRules,
      includeTimeLogRules,
    });

    // Validate filtered rules
    if (filteredRules.length === 0) {
      throw new Error("No rules match the provided filters");
    }

    // Generate content based on format
    switch (format) {
      case "markdown":
        return this.generateMarkdownContent(filteredRules, includeMetadata);
      case "json":
        return this.generateJsonContent(filteredRules, includeMetadata);
      case "plain":
        return this.generatePlainContent(filteredRules, includeMetadata);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Filters rules based on category options
   */
  private filterRules(options: {
    includeTimeRules: boolean;
    includePlanningRules: boolean;
    includeTaskRules: boolean;
    includePermissionRules: boolean;
    includeTimeLogRules: boolean;
  }): BusinessRule[] {
    return RulesBuilderService.DEFAULT_RULES.filter((rule) => {
      switch (rule.category) {
        case "time":
          return options.includeTimeRules;
        case "planning":
          return options.includePlanningRules;
        case "task":
          return options.includeTaskRules;
        case "permission":
          return options.includePermissionRules;
        case "time-log":
          return options.includeTimeLogRules;
        default:
          return false;
      }
    });
  }

  /**
   * Generates markdown formatted content
   */
  private generateMarkdownContent(rules: BusinessRule[], includeMetadata: boolean): string {
    const lines: string[] = [];

    if (includeMetadata) {
      lines.push("# Business Rules");
      lines.push("");
      lines.push(`**Generated:** ${new Date().toISOString()}`);
      lines.push(`**Total Rules:** ${rules.length}`);
      lines.push("");
    }

    // Group by category
    const grouped = this.groupByCategory(rules);

    for (const [category, categoryRules] of Object.entries(grouped)) {
      lines.push(`## ${this.capitalizeCategory(category)}`);
      lines.push("");

      for (const rule of categoryRules) {
        lines.push(`### ${rule.name} (${rule.id})`);
        lines.push("");
        lines.push(`**Description:** ${rule.description}`);
        lines.push("");
        lines.push(`**Severity:** ${this.formatSeverity(rule.severity)}`);
        lines.push("");
        lines.push(`**Condition:** ${rule.condition}`);
        lines.push("");
        lines.push(`**Action:** ${rule.action}`);
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  /**
   * Generates JSON formatted content
   */
  private generateJsonContent(rules: BusinessRule[], includeMetadata: boolean): string {
    const output: {
      metadata?: {
        generated: string;
        totalRules: number;
      };
      rules: BusinessRule[];
    } = {
      rules,
    };

    if (includeMetadata) {
      output.metadata = {
        generated: new Date().toISOString(),
        totalRules: rules.length,
      };
    }

    return JSON.stringify(output, null, 2);
  }

  /**
   * Generates plain text formatted content
   */
  private generatePlainContent(rules: BusinessRule[], includeMetadata: boolean): string {
    const lines: string[] = [];

    if (includeMetadata) {
      lines.push(`Business Rules - Generated: ${new Date().toISOString()}`);
      lines.push(`Total Rules: ${rules.length}`);
      lines.push("");
    }

    for (const rule of rules) {
      lines.push(`${rule.id}: ${rule.name}`);
      lines.push(`  Category: ${rule.category}`);
      lines.push(`  Severity: ${rule.severity}`);
      lines.push(`  Description: ${rule.description}`);
      lines.push(`  Condition: ${rule.condition}`);
      lines.push(`  Action: ${rule.action}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  /**
   * Groups rules by category
   */
  private groupByCategory(rules: BusinessRule[]): Record<string, BusinessRule[]> {
    return rules.reduce(
      (acc, rule) => {
        if (!acc[rule.category]) {
          acc[rule.category] = [];
        }
        acc[rule.category].push(rule);
        return acc;
      },
      {} as Record<string, BusinessRule[]>
    );
  }

  /**
   * Capitalizes category name for display
   */
  private capitalizeCategory(category: string): string {
    return category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Formats severity for display
   */
  private formatSeverity(severity: BusinessRule["severity"]): string {
    const severityMap: Record<string, string> = {
      error: "🔴 Error",
      warning: "🟡 Warning",
      info: "ℹ️ Info",
    };
    return severityMap[severity] || severity;
  }

  /**
   * Gets all available rules
   */
  static getAllRules(): BusinessRule[] {
    return [...RulesBuilderService.DEFAULT_RULES];
  }

  /**
   * Gets rules by category
   */
  static getRulesByCategory(category: BusinessRule["category"]): BusinessRule[] {
    return RulesBuilderService.DEFAULT_RULES.filter((rule) => rule.category === category);
  }

  /**
   * Gets rules by severity
   */
  static getRulesBySeverity(severity: BusinessRule["severity"]): BusinessRule[] {
    return RulesBuilderService.DEFAULT_RULES.filter((rule) => rule.severity === severity);
  }
}
