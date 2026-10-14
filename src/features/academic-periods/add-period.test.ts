// Sample Tahun akademik of this file: 2092 to 2092.
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import { academicPeriodChanges, academicPeriods, accounts } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addPeriod } from "./add-period";
import { NOT_ALLOWED } from "./not-allowed";
import type { SentPeriod } from "./period-input";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/** A period as the form sends it, with nothing wrong in it. */
const SENT_PERIOD: SentPeriod = {
  year: "2092/2093",
  term: "odd",
  startsOn: "2092-08-01",
  endsOn: "2093-01-31",
};

describe("addPeriod", () => {
  it("lets Kepala Unit add a period", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const added = await addPeriod(db, actor, SENT_PERIOD);

      expect(added).toEqual({ ok: true, value: "Ganjil 2092/2093" });
      expect(await db.select().from(academicPeriods)).toMatchObject([
        {
          startYear: 2092,
          term: "odd",
          startsOn: "2092-08-01",
          endsOn: "2093-01-31",
        },
      ]);
    });
  });

  it("writes who added it, when, and the days to the log", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      await addPeriod(db, actor, SENT_PERIOD);

      const [period] = await db.select().from(academicPeriods);
      const log = await db
        .select({ line: academicPeriodChanges, by: accounts.name })
        .from(academicPeriodChanges)
        .innerJoin(accounts, eq(accounts.id, academicPeriodChanges.changedBy));
      expect(log).toHaveLength(1);
      expect(log[0]?.by).toBe("Kepala Uji");
      expect(log[0]?.line.changedAt).toBeInstanceOf(Date);
      expect(log[0]?.line).toMatchObject({
        periodId: period?.id,
        action: "added",
        startsOnBefore: null,
        endsOnBefore: null,
        startsOnAfter: "2092-08-01",
        endsOnAfter: "2093-01-31",
      });
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "head_of_unit"))(
    "refuses %s and saves nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const added = await addPeriod(db, actor, SENT_PERIOD);

        expect(added).toEqual(NOT_ALLOWED);
        expect(await db.select().from(academicPeriods)).toEqual([]);
        expect(await db.select().from(academicPeriodChanges)).toEqual([]);
      });
    },
  );

  it("saves nothing when the end is not after the start", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);

      const added = await addPeriod(db, actor, {
        ...SENT_PERIOD,
        endsOn: SENT_PERIOD.startsOn,
      });

      expect(added).toEqual({
        ok: false,
        error: "Selesai harus setelah Mulai.",
      });
      expect(await db.select().from(academicPeriods)).toEqual([]);
    });
  });

  it("saves nothing when the same year and Ganjil or Genap exists", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await addPeriod(db, actor, SENT_PERIOD);

      const again = await addPeriod(db, actor, {
        ...SENT_PERIOD,
        startsOn: "2094-08-01",
        endsOn: "2095-01-31",
      });

      expect(again).toEqual({
        ok: false,
        error: "Periode Ganjil 2092/2093 sudah ada.",
      });
      expect(await db.select().from(academicPeriods)).toHaveLength(1);
      expect(await db.select().from(academicPeriodChanges)).toHaveLength(1);
    });
  });

  it.each([
    ["starts on the last day of another", "2093-01-31", "2093-07-31"],
    ["ends on the first day of another", "2092-02-01", "2092-08-01"],
    ["lies inside another", "2092-09-01", "2092-10-01"],
    ["covers another", "2092-07-01", "2093-03-01"],
  ])(
    "saves nothing when it %s, and says which",
    async (_what, startsOn, endsOn) => {
      await inTestDatabase(async (db) => {
        const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
        await addPeriod(db, actor, SENT_PERIOD);

        const added = await addPeriod(db, actor, {
          year: "2092/2093",
          term: "even",
          startsOn,
          endsOn,
        });

        expect(added).toEqual({
          ok: false,
          error:
            "Tanggal bertumpuk dengan periode Ganjil 2092/2093 (1 Agu 2092 – 31 Jan 2093). Pilih tanggal di luar periode itu.",
        });
        expect(await db.select().from(academicPeriods)).toHaveLength(1);
      });
    },
  );

  it("takes a period that starts the day after another ends", async () => {
    await inTestDatabase(async (db) => {
      const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
      await addPeriod(db, actor, SENT_PERIOD);

      const added = await addPeriod(db, actor, {
        year: "2092/2093",
        term: "even",
        startsOn: "2093-02-01",
        endsOn: "2093-07-31",
      });

      expect(added).toEqual({ ok: true, value: "Genap 2092/2093" });
    });
  });
});
