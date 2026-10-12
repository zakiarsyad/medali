import { describe, expect, it } from "vitest";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readAcademicPeriods, readRunningPeriod } from "./stored-periods";

const inTestDatabase = withTestDatabase();

const EVEN_2025 = {
  startYear: 2025,
  term: "even",
  startsOn: "2026-02-01",
  endsOn: "2026-07-15",
} as const;
const ODD_2026 = {
  startYear: 2026,
  term: "odd",
  startsOn: "2026-08-01",
  endsOn: "2027-01-31",
} as const;

describe("readAcademicPeriods", () => {
  it("lists the periods newest first", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2025, ODD_2026]);

      const periods = await readAcademicPeriods(db);

      expect(periods).toMatchObject([ODD_2026, EVEN_2025]);
    });
  });
});

describe("readRunningPeriod", () => {
  it("gives the stored period a day falls in", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2025, ODD_2026]);

      expect(await readRunningPeriod(db, "2026-10-12")).toMatchObject(ODD_2026);
    });
  });

  it("keeps the period that ended last between two periods", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2025, ODD_2026]);

      expect(await readRunningPeriod(db, "2026-07-20")).toMatchObject(
        EVEN_2025,
      );
    });
  });

  it("makes no period by itself after the last one ended", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values([EVEN_2025, ODD_2026]);

      expect(await readRunningPeriod(db, "2028-03-01")).toMatchObject(ODD_2026);
      expect(await db.select().from(academicPeriods)).toHaveLength(2);
    });
  });

  it("says there is no period before the first one, or with none stored", async () => {
    await inTestDatabase(async (db) => {
      expect(await readRunningPeriod(db, "2026-10-12")).toBeNull();
      await db.insert(academicPeriods).values(ODD_2026);

      expect(await readRunningPeriod(db, "2026-07-31")).toBeNull();
    });
  });

  it("answers for today when no day is given", async () => {
    await inTestDatabase(async (db) => {
      await db.insert(academicPeriods).values({
        startYear: 2000,
        term: "odd",
        startsOn: "2000-08-01",
        endsOn: "2001-01-31",
      });

      expect(await readRunningPeriod(db)).toMatchObject({ startYear: 2000 });
    });
  });
});
