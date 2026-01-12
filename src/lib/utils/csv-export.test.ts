import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToCSV, flattenForCSV } from "./csv-export";

describe("csv-export utilities", () => {
  beforeEach(() => {
    // Mock DOM methods
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();

    // Mock document methods
    document.createElement = vi.fn(() => {
      const link = {
        href: "",
        download: "",
        click: vi.fn(),
      } as any;
      return link;
    });

    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("exportToCSV", () => {
    it("should export simple data to CSV", () => {
      const data = [
        { name: "John", age: 30, city: "Warsaw" },
        { name: "Jane", age: 25, city: "Krakow" },
      ];

      expect(() => exportToCSV(data, "test")).not.toThrow();

      const createElementSpy = vi.mocked(document.createElement);
      expect(createElementSpy).toHaveBeenCalledWith("a");
    });

    it("should throw error for empty data", () => {
      const data: Record<string, unknown>[] = [];

      expect(() => exportToCSV(data, "test")).toThrow("No data to export");
    });

    it("should handle data with special characters", () => {
      const data = [{ name: 'John, "The Great"', description: "Line 1\nLine 2" }];

      expect(() => exportToCSV(data, "test")).not.toThrow();
    });

    it("should include BOM for Excel compatibility", () => {
      const data = [{ name: "Test" }];
      const createBlobSpy = vi.spyOn(global, "Blob").mockImplementation((parts: any[]) => {
        const content = parts[0];
        // Check if BOM is present (UTF-8 BOM is \ufeff)
        expect(content.startsWith("\ufeff")).toBe(true);
        return {} as Blob;
      });

      exportToCSV(data, "test");

      createBlobSpy.mockRestore();
    });

    it("should generate filename with date", () => {
      const data = [{ name: "Test" }];
      const link = document.createElement("a") as any;
      vi.mocked(document.createElement).mockReturnValue(link);

      exportToCSV(data, "report");

      // Filename should include date in ISO format (YYYY-MM-DD)
      const expectedPattern = /^report_\d{4}-\d{2}-\d{2}\.csv$/;
      expect(link.download).toMatch(expectedPattern);
    });

    it("should handle different data types", () => {
      const data = [
        {
          string: "text",
          number: 123,
          boolean: true,
          nullValue: null,
          undefinedValue: undefined,
        },
      ];

      expect(() => exportToCSV(data, "test")).not.toThrow();
    });
  });

  describe("flattenForCSV", () => {
    it("should flatten nested objects", () => {
      const data = [
        {
          name: "John",
          address: {
            street: "Main St",
            city: "Warsaw",
          },
        },
      ];

      const flattened = flattenForCSV(data);

      expect(flattened).toEqual([
        {
          name: "John",
          address_street: "Main St",
          address_city: "Warsaw",
        },
      ]);
    });

    it("should convert arrays to semicolon-separated strings", () => {
      const data = [
        {
          name: "John",
          tags: ["tag1", "tag2", "tag3"],
        },
      ];

      const flattened = flattenForCSV(data);

      expect(flattened).toEqual([
        {
          name: "John",
          tags: "tag1; tag2; tag3",
        },
      ]);
    });

    it("should handle simple objects without nesting", () => {
      const data = [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
      ];

      const flattened = flattenForCSV(data);

      expect(flattened).toEqual(data);
    });

    it("should handle mixed nested and flat objects", () => {
      const data = [
        {
          name: "John",
          age: 30,
          address: {
            street: "Main St",
            city: "Warsaw",
          },
          tags: ["tag1", "tag2"],
        },
      ];

      const flattened = flattenForCSV(data);

      expect(flattened).toEqual([
        {
          name: "John",
          age: 30,
          address_street: "Main St",
          address_city: "Warsaw",
          tags: "tag1; tag2",
        },
      ]);
    });

    it("should handle null and undefined values", () => {
      const data = [
        {
          name: "John",
          nullValue: null,
          undefinedValue: undefined,
        },
      ];

      const flattened = flattenForCSV(data);

      expect(flattened[0].name).toBe("John");
      expect(flattened[0].nullValue).toBeNull();
      expect(flattened[0].undefinedValue).toBeUndefined();
    });

    it("should handle empty arrays", () => {
      const data = [
        {
          name: "John",
          tags: [],
        },
      ];

      const flattened = flattenForCSV(data);

      expect(flattened).toEqual([
        {
          name: "John",
          tags: "",
        },
      ]);
    });

    it("should handle deeply nested objects", () => {
      const data = [
        {
          user: {
            profile: {
              name: "John",
              age: 30,
            },
          },
        },
      ];

      const flattened = flattenForCSV(data);

      // flattenForCSV only flattens one level deep, so nested objects remain nested
      expect(flattened).toEqual([
        {
          user_profile: {
            name: "John",
            age: 30,
          },
        },
      ]);
    });
  });
});
