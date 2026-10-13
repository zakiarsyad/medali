import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { AccountForAccess } from "@/auth/access";
import { studentSurveyPeriods } from "@/db/schema";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { addTestSurveyPeriod } from "@/mentoring/test-survey-periods";
import {
  cancelSurveyPeriod,
  closeSurveyPeriod,
  NOT_RUNNING,
} from "./change-survey-period";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";

/*
 * A survey period is never erased, so no rows are removed after the
 * check: the database is dropped at the end. Each check ends its own
 * period, so the next one can add another.
 */
const own = withOwnTestDatabase("ubahsurvei");

interface Opened {
  id: string;
  first: AccountForAccess;
  second: AccountForAccess;
}

/** A period that is open on the day of its year's 13 October, and two Kepala Unit. */
async function addOpenPeriod(startYear: number): Promise<Opened> {
  const periods = await addTestPeriods(own.db, startYear);
  const first = await addTestEvaluator(own.db, ["head_of_unit"], "Kepala A");
  const second = await addTestEvaluator(own.db, ["head_of_unit"], "Kepala B");
  const id = await addTestSurveyPeriod(own.db, {
    periodId: periods.runningId,
    openedBy: first.id,
    startsOn: `${startYear + 1}-10-10`,
    endsOn: `${startYear + 1}-10-24`,
  });
  return { id, first, second };
}

async function storedWith(id: string) {
  const [period] = await own.db
    .select()
    .from(studentSurveyPeriods)
    .where(eq(studentSurveyPeriods.id, id));
  return period;
}

describe("Tutup periode sekarang pressed twice at the same moment", () => {
  it("closes once: the second close waits, then is told the period runs no more", async () => {
    const { id, first, second } = await addOpenPeriod(2167);
    const today = "2168-10-13";

    const both = await own.atOnce(
      (db) => closeSurveyPeriod(db, first, id, today),
      (db) => closeSurveyPeriod(db, second, id, today),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(NOT_RUNNING);
    expect(await storedWith(id)).toMatchObject({
      closedBy: first.id,
      cancelledAt: null,
    });
  });
});

describe("Batalkan periode pressed while Tutup periode sekarang is on its way", () => {
  it("keeps the close: the cancel waits, then is told the period runs no more", async () => {
    const { id, first, second } = await addOpenPeriod(2171);
    const today = "2172-10-13";

    const both = await own.atOnce(
      (db) => closeSurveyPeriod(db, first, id, today),
      (db) => cancelSurveyPeriod(db, second, id, today),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(NOT_RUNNING);
    expect(await storedWith(id)).toMatchObject({
      closedBy: first.id,
      cancelledAt: null,
      cancelledBy: null,
    });
  });
});

describe("Batalkan periode pressed twice at the same moment", () => {
  it("cancels once: the second cancel waits, then is told the period runs no more", async () => {
    const { id, first, second } = await addOpenPeriod(2175);
    const today = "2176-10-13";

    const both = await own.atOnce(
      (db) => cancelSurveyPeriod(db, first, id, today),
      (db) => cancelSurveyPeriod(db, second, id, today),
    );

    expect(both.sooner).toEqual({ ok: true, value: null });
    expect(both.later).toEqual(NOT_RUNNING);
    expect(await storedWith(id)).toMatchObject({
      cancelledBy: first.id,
      closedAt: null,
    });
  });
});
