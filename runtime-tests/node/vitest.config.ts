/// <reference types="vitest" />
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/runtime-tests/node/**/*.+(ts|tsx|js)"],
    exclude: ["**/runtime-tests/node/vitest.config.ts"],
  },
});
