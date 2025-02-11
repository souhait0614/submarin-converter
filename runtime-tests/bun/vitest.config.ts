/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/runtime-tests/bun/**/*.+(ts|tsx|js)"],
    exclude: ["**/runtime-tests/bun/vitest.config.ts"],
  },
});
