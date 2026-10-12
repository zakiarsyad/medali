import { asc, eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { academicPeriodChanges, academicPeriods } from "@/db/schema";
import { type Save, withOwnTestDatabase } from "@/db/test-database-at-once";
import type { Parsed } from "@/parsed";
import { addPeriod } from "./add-period";
import { changePeriodDates } from "./change-period-dates";
import type { PeriodDates, SentPeriod } from "./period-input";
import { addTestActor, SENT_PERIOD } from "./test-records";

/*
 * The log of period changes cannot be emptied, so no rows are removed
 * after a check: each check adds a period of its own, on days no other
 * check uses, and the database is dropped at the end.
 */
const own = withOwnTestDatabase("periods");

const TODAY = "2026-10-12";
const TOMORROW = "2026-10-13";

let head: Awaited<ReturnType<typeof addTestActor>>;

beforeAll(async () => {
  head = await addTestActor(own.db, "Kepala Uji Serentak", ["head_of_unit"]);
});

/** Adds a period and gives back its id. */
async function addOwnPeriod(sent: SentPeriod): Promise<string> {
  const added = await addPeriod(own.db, head, sent);
  if (!added.ok) throw new Error(added.error);
  const [period] = await own.db
    .select({ id: academicPeriods.id })
    .from(academicPeriods)
    .where(eq(academicPeriods.startsOn, sent.startsOn));
  if (!period) throw new Error("The period was not added.");
  return period.id;
}

/** Adds Genap of a year, 1 Feb to 31 Jul. */
function addEvenPeriod(startYear: number): Promise<string> {
  return addOwnPeriod({
    year: `${startYear}/${startYear + 1}`,
    term: "even",
    startsOn: `${startYear + 1}-02-01`,
    endsOn: `${startYear + 1}-07-31`,
  });
}

function save(
  id: string,
  dates: PeriodDates,
  today: string = TODAY,
): Save<Parsed<string>> {
  return (db) => changePeriodDates(db, head, id, dates, today);
}

async function savedDates(id: string): Promise<PeriodDates | undefined> {
  const [period] = await own.db
    .select({
      startsOn: academicPeriods.startsOn,
      endsOn: academicPeriods.endsOn,
    })
    .from(academicPeriods)
    .where(eq(academicPeriods.id, id));
  return period;
}

/** The lines for changed dates in the log of one period, oldest first. */
async function dateLines(id: string) {
  const log = await own.db
    .select()
    .from(academicPeriodChanges)
    .where(eq(academicPeriodChanges.periodId, id))
    .orderBy(asc(academicPeriodChanges.changedAt));
  return log
    .filter((line) => line.action === "dates_changed")
    .map((line) => ({
      before: { startsOn: line.startsOnBefore, endsOn: line.endsOnBefore },
      after: { startsOn: line.startsOnAfter, endsOn: line.endsOnAfter },
    }));
}

describe("two changes to the dates of one period sent at the same moment", () => {
  it("ends with the dates of the save taken last, and a log that follows", async () => {
    const id = await addEvenPeriod(2026);
    const first = { startsOn: "2027-02-10", endsOn: "2027-07-31" };
    const second = { startsOn: "2027-02-12", endsOn: "2027-07-30" };

    const both = await own.atOnce(save(id, first), save(id, second));

    expect(both.sooner).toEqual({ ok: true, value: "Genap 2026/2027" });
    expect(both.later).toEqual({ ok: true, value: "Genap 2026/2027" });
    expect(await savedDates(id)).toEqual(second);
    expect(await dateLines(id)).toEqual([
      {
        before: { startsOn: "2027-02-01", endsOn: "2027-07-31" },
        after: first,
      },
      { before: first, after: second },
    ]);
  });

  it("saves nothing when the save taken second asks for the dates the period now holds", async () => {
    const id = await addEvenPeriod(2027);
    const dates = { startsOn: "2028-02-10", endsOn: "2028-07-31" };

    const both = await own.atOnce(save(id, dates), save(id, dates));

    expect(both.sooner).toEqual({ ok: true, value: "Genap 2027/2028" });
    expect(both.later).toEqual({
      ok: false,
      error: "Tanggal masih sama, tidak ada yang diubah.",
    });
    expect(await savedDates(id)).toEqual(dates);
    expect(await dateLines(id)).toHaveLength(1);
  });

  it("refuses the save taken second when the first one ended the period", async () => {
    const id = await addOwnPeriod(SENT_PERIOD);
    const endsToday = { startsOn: SENT_PERIOD.startsOn, endsOn: TODAY };
    const endsLater = { startsOn: SENT_PERIOD.startsOn, endsOn: "2026-11-30" };

    const both = await own.atOnce(
      save(id, endsToday, TODAY),
      save(id, endsLater, TOMORROW),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Ganjil 2026/2027" });
    expect(both.later).toEqual({
      ok: false,
      error: "Periode yang sudah selesai tidak bisa diubah lagi.",
    });
    expect(await savedDates(id)).toEqual(endsToday);
    expect(await dateLines(id)).toHaveLength(1);
  });

  it("still refuses the second of two periods moved onto the same days", async () => {
    const earlier = await addEvenPeriod(2030);
    const later = await addEvenPeriod(2031);
    const unchanged = await savedDates(later);

    const both = await own.atOnce(
      save(earlier, { startsOn: "2031-02-01", endsOn: "2031-09-30" }),
      save(later, { startsOn: "2031-09-01", endsOn: "2032-07-31" }),
    );

    expect(both.sooner).toEqual({ ok: true, value: "Genap 2030/2031" });
    expect(both.later).toEqual({
      ok: false,
      error:
        "Tanggal bertumpuk dengan periode Genap 2030/2031 (1 Feb 2031 – 30 Sep 2031). Pilih tanggal di luar periode itu.",
    });
    expect(await savedDates(later)).toEqual(unchanged);
    expect(await dateLines(later)).toHaveLength(0);
  });
});
