import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { css: true, include: ["tests/**/*.test.{ts,tsx}"] },
});
