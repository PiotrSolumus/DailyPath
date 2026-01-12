import { describe, it, expect, beforeEach, vi } from "vitest";
import { RulesBuilderService, type BusinessRule, type RulesBuilderOptions } from "./rules-builder.service";

describe("RulesBuilderService", () => {
  let service: RulesBuilderService;

  beforeEach(() => {
    service = new RulesBuilderService();
  });

  describe("generateRulesContent", () => {
    describe("Happy path scenarios", () => {
      it("should generate markdown content with all rules by default", () => {
        const content = service.generateRulesContent();

        // Without metadata, header is not included
        expect(content).toContain("## Time");
        expect(content).toContain("## Planning");
        expect(content).toContain("## Task");
        expect(content).toContain("## Permission");
        expect(content).toContain("## Time Log");
        expect(content).toContain("15-Minute Alignment");
        expect(content).toContain("Overlap Prevention");
        expect(content).toContain("Private Task Masking");
      });

      it("should generate markdown content with metadata when includeMetadata is true", () => {
        const content = service.generateRulesContent({
          includeMetadata: true,
          format: "markdown",
        });

        expect(content).toContain("# Business Rules");
        expect(content).toContain("**Generated:**");
        expect(content).toContain("**Total Rules:**");
        expect(content).toMatch(/\*\*Total Rules:\*\* \d+/);
      });

      it("should generate JSON content with all rules", () => {
        const content = service.generateRulesContent({
          format: "json",
        });

        const parsed = JSON.parse(content);
        expect(parsed).toHaveProperty("rules");
        expect(Array.isArray(parsed.rules)).toBe(true);
        expect(parsed.rules.length).toBeGreaterThan(0);

        // Validate rule structure
        const firstRule = parsed.rules[0];
        expect(firstRule).toHaveProperty("id");
        expect(firstRule).toHaveProperty("name");
        expect(firstRule).toHaveProperty("description");
        expect(firstRule).toHaveProperty("category");
        expect(firstRule).toHaveProperty("severity");
        expect(firstRule).toHaveProperty("condition");
        expect(firstRule).toHaveProperty("action");
      });

      it("should generate JSON content with metadata when includeMetadata is true", () => {
        const content = service.generateRulesContent({
          format: "json",
          includeMetadata: true,
        });

        const parsed = JSON.parse(content);
        expect(parsed).toHaveProperty("metadata");
        expect(parsed.metadata).toHaveProperty("generated");
        expect(parsed.metadata).toHaveProperty("totalRules");
        expect(typeof parsed.metadata.generated).toBe("string");
        expect(typeof parsed.metadata.totalRules).toBe("number");
      });

      it("should generate plain text content", () => {
        const content = service.generateRulesContent({
          format: "plain",
        });

        // Without metadata, "Business Rules" header is not included
        expect(content).toContain("time-001: 15-Minute Alignment");
        expect(content).toContain("Category: time");
        expect(content).toContain("Severity: error");
      });

      it("should generate plain text content with metadata when includeMetadata is true", () => {
        const content = service.generateRulesContent({
          format: "plain",
          includeMetadata: true,
        });

        expect(content).toContain("Business Rules - Generated:");
        expect(content).toContain("Total Rules:");
        expect(content).toMatch(/Total Rules: \d+/);
        expect(content).toContain("time-001: 15-Minute Alignment");
      });
    });

    describe("Rule filtering", () => {
      it("should filter to only time rules when other categories are disabled", () => {
        const content = service.generateRulesContent({
          includeTimeRules: true,
          includePlanningRules: false,
          includeTaskRules: false,
          includePermissionRules: false,
          includeTimeLogRules: false,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const allTimeRules = parsed.rules.every((rule: BusinessRule) => rule.category === "time");
        expect(allTimeRules).toBe(true);
        expect(parsed.rules.length).toBeGreaterThan(0);
      });

      it("should filter to only planning rules when other categories are disabled", () => {
        const content = service.generateRulesContent({
          includeTimeRules: false,
          includePlanningRules: true,
          includeTaskRules: false,
          includePermissionRules: false,
          includeTimeLogRules: false,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const allPlanningRules = parsed.rules.every((rule: BusinessRule) => rule.category === "planning");
        expect(allPlanningRules).toBe(true);
        expect(parsed.rules.length).toBeGreaterThan(0);
      });

      it("should filter to only task rules when other categories are disabled", () => {
        const content = service.generateRulesContent({
          includeTimeRules: false,
          includePlanningRules: false,
          includeTaskRules: true,
          includePermissionRules: false,
          includeTimeLogRules: false,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const allTaskRules = parsed.rules.every((rule: BusinessRule) => rule.category === "task");
        expect(allTaskRules).toBe(true);
        expect(parsed.rules.length).toBeGreaterThan(0);
      });

      it("should filter to only permission rules when other categories are disabled", () => {
        const content = service.generateRulesContent({
          includeTimeRules: false,
          includePlanningRules: false,
          includeTaskRules: false,
          includePermissionRules: true,
          includeTimeLogRules: false,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const allPermissionRules = parsed.rules.every((rule: BusinessRule) => rule.category === "permission");
        expect(allPermissionRules).toBe(true);
        expect(parsed.rules.length).toBeGreaterThan(0);
      });

      it("should filter to only time-log rules when other categories are disabled", () => {
        const content = service.generateRulesContent({
          includeTimeRules: false,
          includePlanningRules: false,
          includeTaskRules: false,
          includePermissionRules: false,
          includeTimeLogRules: true,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const allTimeLogRules = parsed.rules.every((rule: BusinessRule) => rule.category === "time-log");
        expect(allTimeLogRules).toBe(true);
        expect(parsed.rules.length).toBeGreaterThan(0);
      });

      it("should include multiple categories when specified", () => {
        const content = service.generateRulesContent({
          includeTimeRules: true,
          includePlanningRules: true,
          includeTaskRules: false,
          includePermissionRules: false,
          includeTimeLogRules: false,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const categories = new Set(parsed.rules.map((rule: BusinessRule) => rule.category));
        expect(categories.has("time")).toBe(true);
        expect(categories.has("planning")).toBe(true);
        expect(categories.has("task")).toBe(false);
        expect(categories.has("permission")).toBe(false);
        expect(categories.has("time-log")).toBe(false);
      });
    });

    describe("Edge cases and error handling", () => {
      it("should throw error when all categories are disabled", () => {
        const options: RulesBuilderOptions = {
          includeTimeRules: false,
          includePlanningRules: false,
          includeTaskRules: false,
          includePermissionRules: false,
          includeTimeLogRules: false,
        };

        expect(() => service.generateRulesContent(options)).toThrow("No rules match the provided filters");
      });

      it("should throw error for unsupported format", () => {
        expect(() => {
          service.generateRulesContent({
            format: "invalid-format" as any,
          });
        }).toThrow("Unsupported format: invalid-format");
      });

      it("should handle empty options object", () => {
        expect(() => service.generateRulesContent({})).not.toThrow();
        const content = service.generateRulesContent({});
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
      });

      it("should handle undefined options", () => {
        expect(() => service.generateRulesContent(undefined as any)).not.toThrow();
        const content = service.generateRulesContent(undefined as any);
        expect(content).toBeTruthy();
        expect(content.length).toBeGreaterThan(0);
      });
    });

    describe("Content structure validation", () => {
      it("should include all required rule fields in markdown format", () => {
        const content = service.generateRulesContent({
          format: "markdown",
        });

        // Check for rule structure elements
        expect(content).toContain("###");
        expect(content).toContain("**Description:**");
        expect(content).toContain("**Severity:**");
        expect(content).toContain("**Condition:**");
        expect(content).toContain("**Action:**");
      });

      it("should format severity correctly in markdown", () => {
        const content = service.generateRulesContent({
          format: "markdown",
        });

        expect(content).toMatch(/🔴 Error|🟡 Warning|ℹ️ Info/);
      });

      it("should group rules by category in markdown", () => {
        const content = service.generateRulesContent({
          format: "markdown",
        });

        // Check category headers appear before their rules
        const timeIndex = content.indexOf("## Time");
        const planningIndex = content.indexOf("## Planning");
        const taskIndex = content.indexOf("## Task");

        expect(timeIndex).toBeGreaterThan(-1);
        expect(planningIndex).toBeGreaterThan(timeIndex);
        expect(taskIndex).toBeGreaterThan(planningIndex);
      });

      it("should validate JSON structure matches BusinessRule interface", () => {
        const content = service.generateRulesContent({
          format: "json",
        });

        const parsed = JSON.parse(content);
        expect(parsed.rules).toBeInstanceOf(Array);

        parsed.rules.forEach((rule: BusinessRule) => {
          expect(rule).toHaveProperty("id");
          expect(rule).toHaveProperty("name");
          expect(rule).toHaveProperty("description");
          expect(rule).toHaveProperty("category");
          expect(rule).toHaveProperty("severity");
          expect(rule).toHaveProperty("condition");
          expect(rule).toHaveProperty("action");

          // Validate category enum
          expect(["time", "planning", "task", "permission", "time-log"]).toContain(rule.category);

          // Validate severity enum
          expect(["error", "warning", "info"]).toContain(rule.severity);

          // Validate non-empty strings
          expect(typeof rule.id).toBe("string");
          expect(rule.id.length).toBeGreaterThan(0);
          expect(typeof rule.name).toBe("string");
          expect(rule.name.length).toBeGreaterThan(0);
        });
      });
    });

    describe("Business rules validation", () => {
      it("should include time-001 rule (15-Minute Alignment)", () => {
        const content = service.generateRulesContent({
          includeTimeRules: true,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const timeRule = parsed.rules.find((r: BusinessRule) => r.id === "time-001");

        expect(timeRule).toBeDefined();
        expect(timeRule.name).toBe("15-Minute Alignment");
        expect(timeRule.category).toBe("time");
        expect(timeRule.severity).toBe("error");
      });

      it("should include planning-001 rule (Overlap Prevention)", () => {
        const content = service.generateRulesContent({
          includePlanningRules: true,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const planningRule = parsed.rules.find((r: BusinessRule) => r.id === "planning-001");

        expect(planningRule).toBeDefined();
        expect(planningRule.name).toBe("Overlap Prevention");
        expect(planningRule.category).toBe("planning");
        expect(planningRule.severity).toBe("error");
      });

      it("should include task-001 rule (Private Task Masking)", () => {
        const content = service.generateRulesContent({
          includeTaskRules: true,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const taskRule = parsed.rules.find((r: BusinessRule) => r.id === "task-001");

        expect(taskRule).toBeDefined();
        expect(taskRule.name).toBe("Private Task Masking");
        expect(taskRule.category).toBe("task");
        expect(taskRule.severity).toBe("info");
      });

      it("should include permission-001 rule (Admin Full Access)", () => {
        const content = service.generateRulesContent({
          includePermissionRules: true,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const permissionRule = parsed.rules.find((r: BusinessRule) => r.id === "permission-001");

        expect(permissionRule).toBeDefined();
        expect(permissionRule.name).toBe("Admin Full Access");
        expect(permissionRule.category).toBe("permission");
        expect(permissionRule.severity).toBe("info");
      });

      it("should include time-log-001 rule (7-Day Edit Limit)", () => {
        const content = service.generateRulesContent({
          includeTimeLogRules: true,
          format: "json",
        });

        const parsed = JSON.parse(content);
        const timeLogRule = parsed.rules.find((r: BusinessRule) => r.id === "time-log-001");

        expect(timeLogRule).toBeDefined();
        expect(timeLogRule.name).toBe("7-Day Edit Limit");
        expect(timeLogRule.category).toBe("time-log");
        expect(timeLogRule.severity).toBe("error");
      });

      it("should include all critical error-level rules", () => {
        const content = service.generateRulesContent({
          format: "json",
        });

        const parsed = JSON.parse(content);
        const errorRules = parsed.rules.filter((r: BusinessRule) => r.severity === "error");

        expect(errorRules.length).toBeGreaterThan(0);

        // Verify specific critical rules exist
        const ruleIds = errorRules.map((r: BusinessRule) => r.id);
        expect(ruleIds).toContain("time-001");
        expect(ruleIds).toContain("time-002");
        expect(ruleIds).toContain("planning-001");
        expect(ruleIds).toContain("task-002");
        expect(ruleIds).toContain("task-003");
        expect(ruleIds).toContain("permission-003");
        expect(ruleIds).toContain("time-log-001");
        expect(ruleIds).toContain("time-log-002");
      });
    });

    describe("Format-specific edge cases", () => {
      it("should handle markdown with special characters in rule names", () => {
        const content = service.generateRulesContent({
          format: "markdown",
        });

        // Should not throw and should properly escape if needed
        expect(content).toBeTruthy();
        expect(typeof content).toBe("string");
      });

      it("should generate valid JSON that can be parsed", () => {
        const content = service.generateRulesContent({
          format: "json",
        });

        expect(() => JSON.parse(content)).not.toThrow();
        const parsed = JSON.parse(content);
        expect(parsed).toBeDefined();
      });

      it("should generate consistent output for same options", () => {
        const options: RulesBuilderOptions = {
          includeTimeRules: true,
          includePlanningRules: false,
          format: "json",
        };

        const content1 = service.generateRulesContent(options);
        const content2 = service.generateRulesContent(options);

        expect(content1).toBe(content2);
      });

      it("should include ISO timestamp in metadata when includeMetadata is true", () => {
        const content = service.generateRulesContent({
          format: "json",
          includeMetadata: true,
        });

        const parsed = JSON.parse(content);
        expect(parsed.metadata.generated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });

  describe("Static methods", () => {
    describe("getAllRules", () => {
      it("should return all default rules", () => {
        const rules = RulesBuilderService.getAllRules();

        expect(Array.isArray(rules)).toBe(true);
        expect(rules.length).toBeGreaterThan(0);

        // Verify structure
        rules.forEach((rule) => {
          expect(rule).toHaveProperty("id");
          expect(rule).toHaveProperty("name");
          expect(rule).toHaveProperty("category");
        });
      });

      it("should return immutable copy of rules", () => {
        const rules1 = RulesBuilderService.getAllRules();
        const rules2 = RulesBuilderService.getAllRules();

        expect(rules1).not.toBe(rules2);
        expect(rules1).toEqual(rules2);
      });
    });

    describe("getRulesByCategory", () => {
      it("should return only time category rules", () => {
        const rules = RulesBuilderService.getRulesByCategory("time");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.category).toBe("time");
        });
      });

      it("should return only planning category rules", () => {
        const rules = RulesBuilderService.getRulesByCategory("planning");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.category).toBe("planning");
        });
      });

      it("should return only task category rules", () => {
        const rules = RulesBuilderService.getRulesByCategory("task");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.category).toBe("task");
        });
      });

      it("should return only permission category rules", () => {
        const rules = RulesBuilderService.getRulesByCategory("permission");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.category).toBe("permission");
        });
      });

      it("should return only time-log category rules", () => {
        const rules = RulesBuilderService.getRulesByCategory("time-log");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.category).toBe("time-log");
        });
      });
    });

    describe("getRulesBySeverity", () => {
      it("should return only error severity rules", () => {
        const rules = RulesBuilderService.getRulesBySeverity("error");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.severity).toBe("error");
        });
      });

      it("should return only warning severity rules", () => {
        const rules = RulesBuilderService.getRulesBySeverity("warning");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.severity).toBe("warning");
        });
      });

      it("should return only info severity rules", () => {
        const rules = RulesBuilderService.getRulesBySeverity("info");

        expect(rules.length).toBeGreaterThan(0);
        rules.forEach((rule) => {
          expect(rule.severity).toBe("info");
        });
      });
    });
  });

  describe("Integration scenarios", () => {
    it("should generate complete markdown documentation with all options enabled", () => {
      const content = service.generateRulesContent({
        includeTimeRules: true,
        includePlanningRules: true,
        includeTaskRules: true,
        includePermissionRules: true,
        includeTimeLogRules: true,
        format: "markdown",
        includeMetadata: true,
      });

      // Verify all categories are present
      expect(content).toContain("## Time");
      expect(content).toContain("## Planning");
      expect(content).toContain("## Task");
      expect(content).toContain("## Permission");
      expect(content).toContain("## Time Log");

      // Verify metadata
      expect(content).toContain("# Business Rules");
      expect(content).toContain("**Generated:**");
      expect(content).toContain("**Total Rules:**");
    });

    it("should generate minimal JSON output with only time rules", () => {
      const content = service.generateRulesContent({
        includeTimeRules: true,
        includePlanningRules: false,
        includeTaskRules: false,
        includePermissionRules: false,
        includeTimeLogRules: false,
        format: "json",
        includeMetadata: false,
      });

      const parsed = JSON.parse(content);
      expect(parsed).not.toHaveProperty("metadata");
      expect(parsed.rules.every((r: BusinessRule) => r.category === "time")).toBe(true);
    });

    it("should handle multiple service instances independently", () => {
      const service1 = new RulesBuilderService();
      const service2 = new RulesBuilderService();

      const content1 = service1.generateRulesContent({ format: "json" });
      const content2 = service2.generateRulesContent({ format: "json" });

      expect(content1).toBe(content2);
    });
  });
});
