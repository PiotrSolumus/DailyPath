import { describe, it, expect } from "vitest";
import { taskQuerySchema, createTaskSchema, updateTaskSchema } from "./task.schema";

describe("task schemas", () => {
  describe("taskQuerySchema", () => {
    it("should validate valid query parameters", () => {
      const valid = {
        status: "todo",
        priority: "high",
        department_id: "123e4567-e89b-12d3-a456-426614174000",
        assigned_to_user_id: "123e4567-e89b-12d3-a456-426614174001",
        is_private: true,
      };

      const result = taskQuerySchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it("should accept partial parameters", () => {
      const partial = {
        status: "in_progress",
      };

      const result = taskQuerySchema.parse(partial);
      expect(result).toEqual(partial);
    });

    it("should accept empty object", () => {
      const result = taskQuerySchema.parse({});
      expect(result).toEqual({});
    });

    it("should reject invalid status", () => {
      const invalid = {
        status: "invalid_status",
      };

      expect(() => taskQuerySchema.parse(invalid)).toThrow();
    });

    it("should reject invalid priority", () => {
      const invalid = {
        priority: "invalid_priority",
      };

      expect(() => taskQuerySchema.parse(invalid)).toThrow();
    });

    it("should reject invalid UUID format", () => {
      const invalid = {
        department_id: "not-a-uuid",
      };

      expect(() => taskQuerySchema.parse(invalid)).toThrow();
    });

    it("should coerce boolean for is_private", () => {
      const withString = {
        is_private: "true",
      };

      const result = taskQuerySchema.parse(withString);
      expect(result.is_private).toBe(true);
    });
  });

  describe("createTaskSchema", () => {
    it("should validate valid task creation data", () => {
      const valid = {
        title: "Test Task",
        description: "Test description",
        priority: "medium",
        estimate_minutes: 60,
        assigned_to_type: "user",
        is_private: false,
        due_date: null,
        assigned_id: "123e4567-e89b-12d3-a456-426614174000",
      };

      const result = createTaskSchema.parse(valid);
      expect(result).toEqual(valid);
    });

    it("should reject empty title", () => {
      const invalid = {
        title: "",
        priority: "medium",
        estimate_minutes: 60,
        assigned_to_type: "user",
      };

      expect(() => createTaskSchema.parse(invalid)).toThrow("Title is required");
    });

    it("should reject title longer than 255 characters", () => {
      const invalid = {
        title: "a".repeat(256),
        priority: "medium",
        estimate_minutes: 60,
        assigned_to_type: "user",
      };

      expect(() => createTaskSchema.parse(invalid)).toThrow("Title is too long");
    });

    it("should reject description longer than 5000 characters", () => {
      const invalid = {
        title: "Test Task",
        description: "a".repeat(5001),
        priority: "medium",
        estimate_minutes: 60,
        assigned_to_type: "user",
      };

      expect(() => createTaskSchema.parse(invalid)).toThrow("Description is too long");
    });

    it("should reject estimate less than 15 minutes", () => {
      const invalid = {
        title: "Test Task",
        priority: "medium",
        estimate_minutes: 10,
        assigned_to_type: "user",
      };

      expect(() => createTaskSchema.parse(invalid)).toThrow("Estimate must be at least 15 minutes");
    });

    it("should reject estimate not multiple of 15", () => {
      const invalid = {
        title: "Test Task",
        priority: "medium",
        estimate_minutes: 17,
        assigned_to_type: "user",
      };

      expect(() => createTaskSchema.parse(invalid)).toThrow("Estimate must be a multiple of 15");
    });

    it("should accept valid 15-minute multiples", () => {
      const valid = {
        title: "Test Task",
        priority: "medium",
        estimate_minutes: 45,
        assigned_to_type: "user",
      };

      const result = createTaskSchema.parse(valid);
      expect(result.estimate_minutes).toBe(45);
    });

    it("should set default values", () => {
      const minimal = {
        title: "Test Task",
        priority: "medium",
        estimate_minutes: 60,
        assigned_to_type: "user",
      };

      const result = createTaskSchema.parse(minimal);
      expect(result.description).toBeNull();
      expect(result.is_private).toBe(false);
      expect(result.due_date).toBeNull();
    });

    it("should reject invalid assigned_to_type", () => {
      const invalid = {
        title: "Test Task",
        priority: "medium",
        estimate_minutes: 60,
        assigned_to_type: "invalid",
      };

      expect(() => createTaskSchema.parse(invalid)).toThrow();
    });
  });

  describe("updateTaskSchema", () => {
    it("should validate partial update data", () => {
      const partial = {
        title: "Updated Title",
        status: "in_progress",
      };

      const result = updateTaskSchema.parse(partial);
      expect(result).toEqual(partial);
    });

    it("should accept empty object (no updates)", () => {
      const result = updateTaskSchema.parse({});
      expect(result).toEqual({});
    });

    it("should validate full update data", () => {
      const full = {
        title: "Updated Task",
        description: "Updated description",
        priority: "high",
        status: "blocked",
        estimate_minutes: 90,
        assigned_to_type: "department",
        assigned_user_id: null,
        assigned_department_id: "123e4567-e89b-12d3-a456-426614174000",
        is_private: true,
        due_date: "2026-12-31",
      };

      const result = updateTaskSchema.parse(full);
      expect(result).toEqual(full);
    });

    it("should reject invalid title when provided", () => {
      const invalid = {
        title: "",
      };

      expect(() => updateTaskSchema.parse(invalid)).toThrow("Title is required");
    });

    it("should reject invalid estimate when provided", () => {
      const invalid = {
        estimate_minutes: 10,
      };

      expect(() => updateTaskSchema.parse(invalid)).toThrow("Estimate must be at least 15 minutes");
    });

    it("should allow null for nullable fields", () => {
      const withNulls = {
        description: null,
        assigned_user_id: null,
        due_date: null,
      };

      const result = updateTaskSchema.parse(withNulls);
      expect(result.description).toBeNull();
      expect(result.assigned_user_id).toBeNull();
      expect(result.due_date).toBeNull();
    });
  });
});
