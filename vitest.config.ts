import { defineConfig } from "vitest/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        ".astro/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/test/**",
        "**/tests/**",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
      thresholds: process.env.CI
        ? {} // W CI nie wymuszamy thresholds - tylko raportujemy
        : {
            lines: 70,
            functions: 70,
            branches: 70,
            statements: 70,
          },
    },
    watch: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
