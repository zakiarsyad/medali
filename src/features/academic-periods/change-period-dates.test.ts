// Sample Tahun akademik of this file: 2097 to 2097.
import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriodChanges, academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { addPeriod } from "./add-period";
import { changePeriodDates } from "./change-period-dates";
import { NOT_ALLOWED } from "./not-allowed";
import type { SentPeriod } from "./period-input";
import { addTestActor } from "./test-records";

const inTestDatabase = withTestDatabase();

/** A period as the form sends it, with nothing wrong in it. */
const SENT_PERIOD: SentPeriod = {
  year: "2097/2098",
  term: "odd",
  startsOn: "2097-08-01",
  endsOn: "2098-01-31",
};

const TODAY = "2097-10-12";
const NEW_DATES = { startsOn: "2097-08-10", endsOn: "2098-02-05" };

async function withOnePeriod(db: Database) {
  const actor = await addTestActor(db, "Kepala Uji", ["head_of_unit"]);
  await addPeriod(db, actor, SENT_PERIOD);
  const [period] = await db.select().from(academicPeriods);
  if (!period) throw new Error("The period was not added.");
  return { actor, period };
}

describe("changePeriodDates", () => {
  it("lets Kepala Unit change the days of a period that has not ended", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        NEW_DATES,
        TODAY,
      );

      expect(changed).toEqual({ ok: true, value: "Ganjil 2097/2098" });
      expect(await db.select().from(academicPeriods)).toMatchObject([
        { id: period.id, startYear: 2097, term: "odd", ...NEW_DATES },
      ]);
    });
  });

  it("writes who changed it, when, before and after to the log", async () => {
    await inTestDatabase(async (db) => {
      const { period } = await withOnePeriod(db);
      const second = await addTestActor(db, "Kepala Kedua", ["head_of_unit"]);

      await changePeriodDates(db, second, period.id, NEW_DATES, TODAY);

      const log = await db.select().from(academicPeriodChanges);
      const line = log.find((entry) => entry.action === "dates_changed");
      expect(log).toHaveLength(2);
      expect(line?.changedAt).toBeInstanceOf(Date);
      expect(line).toMatchObject({
        periodId: period.id,
        changedBy: second.id,
        startsOnBefore: "2097-08-01",
        endsOnBefore: "2098-01-31",
        startsOnAfter: "2097-08-10",
        endsOnAfter: "2098-02-05",
      });
    });
  });

  it.each(ROLE_IDS.filter((role) => role !== "head_of_unit"))(
    "refuses %s and changes nothing",
    async (role) => {
      await inTestDatabase(async (db) => {
        const { period } = await withOnePeriod(db);
        const actor = await addTestActor(db, "Pegawai Uji", [role]);

        const changed = await changePeriodDates(
          db,
          actor,
          period.id,
          NEW_DATES,
          TODAY,
        );

        expect(changed).toEqual(NOT_ALLOWED);
        expect(await db.select().from(academicPeriods)).toEqual([period]);
        expect(await db.select().from(academicPeriodChanges)).toHaveLength(1);
      });
    },
  );

  it("still changes a period on its last day", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        NEW_DATES,
        "2098-01-31",
      );

      expect(changed.ok).toBe(true);
    });
  });

  it("refuses to change a period that has ended", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        NEW_DATES,
        "2098-02-01",
      );

      expect(changed).toEqual({
        ok: false,
        error: "Periode yang sudah selesai tidak bisa diubah lagi.",
      });
      expect(await db.select().from(academicPeriods)).toEqual([period]);
      expect(await db.select().from(academicPeriodChanges)).toHaveLength(1);
    });
  });

  it("refuses a new end before today, which would lock the period", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        { startsOn: "2097-08-01", endsOn: "2097-10-11" },
        TODAY,
      );

      expect(changed).toEqual({
        ok: false,
        error: "Selesai tidak boleh sebelum hari ini.",
      });
      expect(await db.select().from(academicPeriods)).toEqual([period]);
      expect(await db.select().from(academicPeriodChanges)).toHaveLength(1);
    });
  });

  it("takes a new end on today", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        { startsOn: "2097-08-01", endsOn: TODAY },
        TODAY,
      );

      expect(changed.ok).toBe(true);
    });
  });

  it("changes nothing when the end is not after the start", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        { startsOn: "2097-08-01", endsOn: "2097-07-01" },
        TODAY,
      );

      expect(changed).toEqual({
        ok: false,
        error: "Selesai harus setelah Mulai.",
      });
      expect(await db.select().from(academicPeriods)).toEqual([period]);
    });
  });

  it("changes nothing when the days overlap another period", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);
      await addPeriod(db, actor, {
        year: "2097/2098",
        term: "even",
        startsOn: "2098-02-01",
        endsOn: "2098-07-31",
      });

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        { startsOn: "2097-08-01", endsOn: "2098-02-01" },
        TODAY,
      );

      expect(changed).toEqual({
        ok: false,
        error:
          "Tanggal bertumpuk dengan periode Genap 2097/2098 (1 Feb 2098 – 31 Jul 2098). Pilih tanggal di luar periode itu.",
      });
      expect(await db.select().from(academicPeriodChanges)).toHaveLength(2);
    });
  });

  it("lets the new days overlap the days the period had before", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        { startsOn: "2097-08-01", endsOn: "2098-01-15" },
        TODAY,
      );

      expect(changed.ok).toBe(true);
    });
  });

  it("changes nothing and logs nothing when the days stay the same", async () => {
    await inTestDatabase(async (db) => {
      const { actor, period } = await withOnePeriod(db);

      const changed = await changePeriodDates(
        db,
        actor,
        period.id,
        { startsOn: period.startsOn, endsOn: period.endsOn },
        TODAY,
      );

      expect(changed).toEqual({
        ok: false,
        error: "Tanggal masih sama, tidak ada yang diubah.",
      });
      expect(await db.select().from(academicPeriodChanges)).toHaveLength(1);
    });
  });

  it.each(["", "bukan-id", "00000000-0000-4000-8000-000000000000"])(
    "finds no period for the id %j",
    async (id) => {
      await inTestDatabase(async (db) => {
        const { actor } = await withOnePeriod(db);

        const changed = await changePeriodDates(
          db,
          actor,
          id,
          NEW_DATES,
          TODAY,
        );

        expect(changed).toEqual({
          ok: false,
          error: "Periode tidak ditemukan.",
        });
      });
    },
  );
});
