import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${path.resolve(__dirname, "apps/roxys-orgel/src")}/`,
      "@lib/db": path.resolve(__dirname, "libs/db/src"),
      "@lib/utils": path.resolve(__dirname, "libs/utils/src"),
    },
  },
  test: {
    include: [
      "apps/**/src/**/__tests__/**/*.test.{ts,tsx}",
      "apps/**/tests/**/*.test.{ts,tsx}",
      "libs/**/src/**/__tests__/**/*.test.{ts,tsx}",
    ],
    globals: true,
  },
});
