import { inject, vi } from "vitest";

// Every check reaches the database through this setting, so it is pointed
// at the checks' own database before a check loads anything.
vi.stubEnv("DATABASE_URL", inject("testDatabaseUrl"));
