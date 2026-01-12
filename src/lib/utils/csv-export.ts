/**
 * Export data to CSV format and trigger download
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) {
    throw new Error("No data to export");
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvRows = [
    // Header row
    headers.map((h) => escapeCSVField(h)).join(","),
    // Data rows
    ...data.map((row) => headers.map((header) => escapeCSVField(String(row[header] ?? ""))).join(",")),
  ];

  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel compatibility
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field (handle commas, quotes, newlines)
 */
function escapeCSVField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Flatten nested objects for CSV export
 */
export function flattenForCSV(data: Record<string, unknown>[]): Record<string, unknown>[] {
  return data.map((item) => {
    const flattened: Record<string, unknown> = {};

    Object.entries(item).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        // Flatten nested object
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          flattened[`${key}_${nestedKey}`] = nestedValue;
        });
      } else if (Array.isArray(value)) {
        // Convert array to string
        flattened[key] = value.join("; ");
      } else {
        flattened[key] = value;
      }
    });

    return flattened;
  });
}
