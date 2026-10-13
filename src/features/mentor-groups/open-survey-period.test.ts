import { describe, expect, it } from "vitest";
import { campusDay } from "@/academic-periods/campus-day";
import { daysAfter } from "@/academic-periods/days-after";
import { daysBefore } from "@/academic-periods/days-before";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { academicPeriods } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestSurveyPeriod,
  testSurveyPeriods,
} from "@/mentoring/test-survey-periods";
import {
  ALREADY_RUNNING,
  NOT_ALLOWED_TO_MANAGE,
  openSurveyPeriod,
} from "./open-survey-period";
import {
  ASK_FOR_DATES,
  ASK_FOR_PERIOD,
  parseSurveyPeriod,
  type SurveyPeriodInput,
} from "./survey-input";
import {
  addTestEvaluator,
  addTestPeriods,
  type TestPeriods,
} from "./test-evaluations";

const inTestDatabase = withTestDatabase();

/** The first of four academic periods of these checks: the third one runs. */
const START_YEAR = 2141;
const TODAY = "2142-10-13";

function inputFor(
  periodId: string,
  more: Partial<SurveyPeriodInput> = {},
): SurveyPeriodInput {
  return {
    periodId,
    startsOn: TODAY,
    endsOn: "2142-10-27",
    achievementWeight: 60,
    note: "Isi sebelum akhir bulan.",
    ...more,
  };
}

async function addHead(db: Database) {
  return addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Survei");
}

/** A survey period of the running academic period, opened by the account. */
function addStored(
  db: Database,
  periods: TestPeriods,
  openedBy: string,
  more: Partial<Parameters<typeof addTestSurveyPeriod>[1]> = {},
) {
  return addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy,
    startsOn: TODAY,
    endsOn: "2142-10-27",
    ...more,
  });
}

describe("openSurveyPeriod", () => {
  it("stores the period as the work of Kepala Unit, and names what was opened", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);

      const opened = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.runningId),
        TODAY,
      );

      expect(opened).toEqual({
        ok: true,
        value: { title: "Ganjil 2142/2143", startsOn: TODAY },
      });
      const stored = await testSurveyPeriods(db);
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        periodId: periods.runningId,
        startsOn: TODAY,
        endsOn: "2142-10-27",
        achievementWeight: 60,
        note: "Isi sebelum akhir bulan.",
        openedBy: head.id,
        closedAt: null,
        cancelledAt: null,
      });
      expect(stored[0]?.openedAt).toBeInstanceOf(Date);
    });
  });

  it("opens one for the academic period before the running one", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);

      const opened = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.beforeId, { note: null }),
        TODAY,
      );

      expect(opened).toMatchObject({
        ok: true,
        value: { title: "Genap 2141/2142" },
      });
    });
  });

  it("opens one that starts later, which waits for its first day", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      const later = { startsOn: "2142-11-01", endsOn: "2142-11-15" };

      const opened = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.runningId, later),
        TODAY,
      );

      expect(opened).toMatchObject({
        ok: true,
        value: { startsOn: "2142-11-01" },
      });
      expect((await testSurveyPeriods(db))[0]).toMatchObject(later);
    });
  });

  it("refuses an academic period that is not offered: an older one, a later one, and one that does not exist", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      const unknown = "0b0b0b0b-1111-4222-8333-444444444444";

      for (const periodId of [periods.olderId, periods.laterId, unknown]) {
        const refused = await openSurveyPeriod(
          db,
          head,
          inputFor(periodId),
          TODAY,
        );

        expect(refused).toEqual({ ok: false, error: ASK_FOR_PERIOD });
      }
      expect(await testSurveyPeriods(db)).toHaveLength(0);
    });
  });

  it("refuses every role but Kepala Unit, and stores nothing", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

      for (const role of others) {
        const actor = await addTestEvaluator(db, [role], `Akun Uji ${role}`);

        const refused = await openSurveyPeriod(
          db,
          actor,
          inputFor(periods.runningId),
          TODAY,
        );

        expect(refused).toEqual(NOT_ALLOWED_TO_MANAGE);
      }
      expect(await testSurveyPeriods(db)).toHaveLength(0);
    });
  });

  it("answers a hand-made first day of year 0000 with the message about the dates, and stores nothing", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      const sent = {
        periodId: periods.runningId,
        startsOn: "0000-01-01",
        endsOn: "2142-10-27",
        achievementWeight: "50",
        note: "",
      };

      // As the action does: what the check lets through goes to the save.
      const parsed = parseSurveyPeriod(sent, TODAY);
      const answer = parsed.ok
        ? await openSurveyPeriod(db, head, parsed.value, TODAY)
        : parsed;

      expect(answer).toEqual({ ok: false, error: ASK_FOR_DATES });
      expect(await testSurveyPeriods(db)).toHaveLength(0);
    });
  });

  it("refuses a second period while one is Dibuka", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      await addStored(db, periods, head.id, { startsOn: "2142-10-01" });

      const refused = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.beforeId),
        TODAY,
      );

      expect(refused).toEqual(ALREADY_RUNNING);
      expect(await testSurveyPeriods(db)).toHaveLength(1);
    });
  });

  it("refuses a second period while one is Terjadwal, also for days before it starts", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      await addStored(db, periods, head.id, {
        startsOn: "2142-12-01",
        endsOn: "2142-12-15",
      });

      const refused = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.runningId),
        TODAY,
      );

      expect(refused).toEqual(ALREADY_RUNNING);
      expect(await testSurveyPeriods(db)).toHaveLength(1);
    });
  });

  it("refuses a second period while one is on its last day", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      await addStored(db, periods, head.id, {
        startsOn: "2142-10-01",
        endsOn: TODAY,
      });

      const refused = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.runningId),
        TODAY,
      );

      expect(refused).toEqual(ALREADY_RUNNING);
    });
  });

  it("opens one beside a period that was closed by hand", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      await addStored(db, periods, head.id, {
        closedBy: head.id,
        closedAt: new Date(),
      });

      const opened = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.runningId),
        TODAY,
      );

      expect(opened.ok).toBe(true);
      expect(await testSurveyPeriods(db)).toHaveLength(2);
    });
  });

  it("opens one beside a period that was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addHead(db);
      await addStored(db, periods, head.id, {
        cancelledBy: head.id,
        cancelledAt: new Date(),
      });

      const opened = await openSurveyPeriod(
        db,
        head,
        inputFor(periods.runningId),
        TODAY,
      );

      expect(opened.ok).toBe(true);
      expect(await testSurveyPeriods(db)).toHaveLength(2);
    });
  });
});

/*
 * The database decides by its own clock whether a period is past its
 * last day, so this check runs on the real day on campus, with academic
 * periods of its own around that day. Those wait behind every other check
 * that adds academic periods of these days, such as the sample data.
 */
describe("openSurveyPeriod on the day of today", { timeout: 20_000 }, () => {
  it("opens one beside a period that is past its last day", async () => {
    await inTestDatabase(async (db) => {
      const today = campusDay();
      const [running] = await db
        .insert(academicPeriods)
        .values([
          {
            startYear: 2145,
            term: "odd",
            startsOn: daysBefore(today, 100),
            endsOn: daysAfter(today, 100),
          },
        ])
        .returning();
      const head = await addHead(db);
      await addTestSurveyPeriod(db, {
        periodId: running?.id ?? "",
        openedBy: head.id,
        startsOn: daysBefore(today, 20),
        endsOn: daysBefore(today, 1),
      });

      const opened = await openSurveyPeriod(
        db,
        head,
        {
          periodId: running?.id ?? "",
          startsOn: today,
          endsOn: daysAfter(today, 14),
          achievementWeight: 50,
          note: null,
        },
        today,
      );

      expect(opened.ok).toBe(true);
      expect(await testSurveyPeriods(db)).toHaveLength(2);
    });
  });
});
