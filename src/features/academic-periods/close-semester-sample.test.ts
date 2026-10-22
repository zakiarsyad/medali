// Sample Tahun akademik of this file: those of the app's sample data.
import { asc, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { activeAccounts } from "@/auth/accounts";
import { readClosingGrades } from "@/character-grades/closing-grades";
import { closingCounts } from "@/character-grades/fixed-grades";
import { academicPeriods, semesterClosings } from "@/db/schema";
import { fillWithSampleData } from "@/db/seed";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { closeSemester } from "./close-semester";

// A closed semester cannot be deleted, so the closing runs in a database
// of its own, which is dropped at the end.
const own = withOwnTestDatabase("tutupsampel");

/** "Within a few seconds" on the preview, with room for a slower computer. */
const CLOSING_LIMIT_MS = 3000;

describe("closing a semester of the sample data", { timeout: 60_000 }, () => {
  it("keeps every Aktif student's grade within a few seconds, as the step counted them", async () => {
    const { db } = own;
    await fillWithSampleData(db);
    const today = campusDay();
    const [oldest] = await db
      .select()
      .from(academicPeriods)
      .orderBy(asc(academicPeriods.startsOn))
      .limit(1);
    const kepala = (await activeAccounts(db)).find((account) =>
      account.roles.includes("head_of_unit"),
    );
    if (!oldest || !kepala) throw new Error("The sample data is not loaded.");
    const step = closingCounts(
      (await readClosingGrades(db, oldest, today)).rows,
    );

    const started = performance.now();
    const closed = await closeSemester(db, kepala, oldest.id, true, today);
    const took = performance.now() - started;

    expect(closed.ok).toBe(true);
    expect(took).toBeLessThan(CLOSING_LIMIT_MS);
    const [closing] = await db
      .select()
      .from(semesterClosings)
      .where(eq(semesterClosings.periodId, oldest.id));
    expect(closing).toMatchObject(step);
    expect(step.students).toBeGreaterThan(0);
  });
});
