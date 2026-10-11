import { defineConfig } from "vitest/config";

// The checks use their own database: in the local Docker database, or in
// the database service of the GitHub checks. Set here, before the setup
// and the checks start, so they never reach the sample data.
process.env.DATABASE_URL = "postgres://medali@localhost:5432/medali_test";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globalSetup: ["src/db/test-setup.ts"],
  },
});
