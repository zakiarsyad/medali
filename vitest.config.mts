import { defineConfig } from "vitest/config";

// The checks use their own database, never the one with the sample data.
// The setup picks its address once, before the checks start, and each
// check is given that address before it loads anything.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globalSetup: ["src/db/test-setup.ts"],
    setupFiles: ["src/db/test-settings.ts"],
  },
});
