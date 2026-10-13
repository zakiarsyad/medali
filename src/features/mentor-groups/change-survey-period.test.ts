import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { readRunningSurveyPeriod } from "@/mentoring/running-survey-period";
import { surveyStatus } from "@/mentoring/survey-status";
import {
  addTestSurveyPeriod,
  testSurveyPeriods,
} from "@/mentoring/test-survey-periods";
import {
  cancelSurveyPeriod,
  changeSurveyEnd,
  closeSurveyPeriod,
  NOT_RUNNING,
} from "./change-survey-period";
import { NOT_ALLOWED_TO_MANAGE } from "./open-survey-period";
import { END_HAS_PASSED, ENDS_BEFORE_START } from "./survey-input";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";

const inTestDatabase = withTestDatabase();

const START_YEAR = 2159;
const TODAY = "2160-10-13";
const STARTS_ON = "2160-10-10";
const ENDS_ON = "2160-10-24";
const UNKNOWN = "0b0b0b0b-1111-4222-8333-444444444444";

type More = Partial<Parameters<typeof addTestSurveyPeriod>[1]>;

/** Kepala Unit and a survey period they opened, which is open on TODAY. */
async function addOpenPeriod(db: Database, more: More = {}) {
  const periods = await addTestPeriods(db, START_YEAR);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Ubah");
  const id = await addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: STARTS_ON,
    endsOn: ENDS_ON,
    ...more,
  });
  return { id, head };
}

async function stored(db: Database) {
  const [period] = await testSurveyPeriods(db);
  if (!period) throw new Error("No survey period is stored.");
  return period;
}

describe("changeSurveyEnd", () => {
  it("gives the running period another last day, later or sooner", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);

      const later = await changeSurveyEnd(db, head, id, "2160-10-31", TODAY);
      const sooner = await changeSurveyEnd(db, head, id, "2160-10-20", TODAY);

      expect(later).toEqual({ ok: true, value: { endsOn: "2160-10-31" } });
      expect(sooner).toEqual({ ok: true, value: { endsOn: "2160-10-20" } });
      expect(await stored(db)).toMatchObject({
        startsOn: STARTS_ON,
        endsOn: "2160-10-20",
        closedAt: null,
        cancelledAt: null,
      });
    });
  });

  it("takes today as the last day: the period stays Dibuka until the day is over", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);

      const changed = await changeSurveyEnd(db, head, id, TODAY, TODAY);

      expect(changed.ok).toBe(true);
      expect(surveyStatus(await stored(db), TODAY)).toBe("open");
    });
  });

  it("refuses a last day before the first day, and keeps the date", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, {
        startsOn: "2160-10-20",
        endsOn: "2160-11-03",
      });

      const refused = await changeSurveyEnd(db, head, id, "2160-10-19", TODAY);

      expect(refused).toEqual({ ok: false, error: ENDS_BEFORE_START });
      expect(await stored(db)).toMatchObject({ endsOn: "2160-11-03" });
    });
  });

  it("refuses a last day that has passed, and keeps the date", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);

      const refused = await changeSurveyEnd(db, head, id, "2160-10-12", TODAY);

      expect(refused).toEqual({ ok: false, error: END_HAS_PASSED });
      expect(await stored(db)).toMatchObject({ endsOn: ENDS_ON });
    });
  });

  it("refuses every role but Kepala Unit, and keeps the date", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addOpenPeriod(db);
      const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

      for (const role of others) {
        const actor = await addTestEvaluator(db, [role], `Akun Uji ${role}`);

        expect(
          await changeSurveyEnd(db, actor, id, "2160-10-31", TODAY),
        ).toEqual(NOT_ALLOWED_TO_MANAGE);
      }
      expect(await stored(db)).toMatchObject({ endsOn: ENDS_ON });
    });
  });

  it("refuses a period that is past its last day: it cannot be opened again by a later date", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, {
        startsOn: "2160-09-20",
        endsOn: "2160-10-12",
      });

      const refused = await changeSurveyEnd(db, head, id, "2160-10-31", TODAY);

      expect(refused).toEqual(NOT_RUNNING);
      expect(await stored(db)).toMatchObject({ endsOn: "2160-10-12" });
    });
  });

  it("refuses a period that was closed by hand", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);
      await closeSurveyPeriod(db, head, id, TODAY);

      const refused = await changeSurveyEnd(db, head, id, "2160-10-31", TODAY);

      expect(refused).toEqual(NOT_RUNNING);
      expect(await stored(db)).toMatchObject({ endsOn: ENDS_ON });
    });
  });

  it("refuses a period that was cancelled", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);
      await cancelSurveyPeriod(db, head, id, TODAY);

      const refused = await changeSurveyEnd(db, head, id, "2160-10-31", TODAY);

      expect(refused).toEqual(NOT_RUNNING);
      expect(await stored(db)).toMatchObject({ endsOn: ENDS_ON });
    });
  });

  it.each([UNKNOWN, "bukan-id", ""])(
    "refuses the id '%s', which names no period",
    async (id) => {
      await inTestDatabase(async (db) => {
        const { head } = await addOpenPeriod(db);

        expect(
          await changeSurveyEnd(db, head, id, "2160-10-31", TODAY),
        ).toEqual(NOT_RUNNING);
      });
    },
  );
});

describe("closeSurveyPeriod", () => {
  it("makes the period Ditutup, and keeps who closed it and when", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addOpenPeriod(db);
      const closer = await addTestEvaluator(db, ["head_of_unit"], "Kepala B");

      const closed = await closeSurveyPeriod(db, closer, id, TODAY);

      expect(closed).toEqual({ ok: true, value: null });
      const period = await stored(db);
      expect(period).toMatchObject({
        closedBy: closer.id,
        endsOn: ENDS_ON,
        cancelledAt: null,
      });
      expect(period.closedAt).toBeInstanceOf(Date);
      expect(surveyStatus(period, TODAY)).toBe("closed");
      expect(await readRunningSurveyPeriod(db, TODAY)).toBe(null);
    });
  });

  it("closes a period that still waits for its first day", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, {
        startsOn: "2160-10-20",
        endsOn: "2160-11-03",
      });

      expect(await closeSurveyPeriod(db, head, id, TODAY)).toEqual({
        ok: true,
        value: null,
      });
      expect(surveyStatus(await stored(db), TODAY)).toBe("closed");
    });
  });

  it("refuses a second close, and keeps who closed it first", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);
      const second = await addTestEvaluator(db, ["head_of_unit"], "Kepala B");
      await closeSurveyPeriod(db, head, id, TODAY);

      expect(await closeSurveyPeriod(db, second, id, TODAY)).toEqual(
        NOT_RUNNING,
      );
      expect(await stored(db)).toMatchObject({ closedBy: head.id });
    });
  });

  it("refuses a period that is past its last day: it is Berakhir, not Ditutup", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, {
        startsOn: "2160-09-20",
        endsOn: "2160-10-12",
      });

      expect(await closeSurveyPeriod(db, head, id, TODAY)).toEqual(NOT_RUNNING);
      expect(surveyStatus(await stored(db), TODAY)).toBe("ended");
    });
  });

  it("refuses every role but Kepala Unit, and the period stays open", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addOpenPeriod(db);
      const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

      for (const role of others) {
        const actor = await addTestEvaluator(db, [role], `Akun Uji ${role}`);

        expect(await closeSurveyPeriod(db, actor, id, TODAY)).toEqual(
          NOT_ALLOWED_TO_MANAGE,
        );
      }
      expect(await stored(db)).toMatchObject({ closedAt: null });
    });
  });

  it("refuses an id that names no period", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addOpenPeriod(db);

      expect(await closeSurveyPeriod(db, head, UNKNOWN, TODAY)).toEqual(
        NOT_RUNNING,
      );
      expect(await closeSurveyPeriod(db, head, "bukan-id", TODAY)).toEqual(
        NOT_RUNNING,
      );
    });
  });
});

describe("cancelSurveyPeriod", () => {
  it("marks the period cancelled with who and when, and keeps the record", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, { note: "Catatan uji." });
      const canceller = await addTestEvaluator(
        db,
        ["head_of_unit"],
        "Kepala B",
      );

      const cancelled = await cancelSurveyPeriod(db, canceller, id, TODAY);

      expect(cancelled).toEqual({ ok: true, value: null });
      const all = await testSurveyPeriods(db);
      expect(all).toHaveLength(1);
      expect(all[0]).toMatchObject({
        id,
        openedBy: head.id,
        startsOn: STARTS_ON,
        endsOn: ENDS_ON,
        note: "Catatan uji.",
        cancelledBy: canceller.id,
        closedAt: null,
      });
      expect(all[0]?.cancelledAt).toBeInstanceOf(Date);
      expect(await readRunningSurveyPeriod(db, TODAY)).toBe(null);
    });
  });

  it("cancels a period that still waits for its first day", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, {
        startsOn: "2160-10-20",
        endsOn: "2160-11-03",
      });

      expect(await cancelSurveyPeriod(db, head, id, TODAY)).toEqual({
        ok: true,
        value: null,
      });
    });
  });

  it("refuses a second cancel, and keeps who cancelled it first", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);
      const second = await addTestEvaluator(db, ["head_of_unit"], "Kepala B");
      await cancelSurveyPeriod(db, head, id, TODAY);

      expect(await cancelSurveyPeriod(db, second, id, TODAY)).toEqual(
        NOT_RUNNING,
      );
      expect(await stored(db)).toMatchObject({ cancelledBy: head.id });
    });
  });

  it("refuses a period that was closed by hand: it stays Ditutup", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db);
      await closeSurveyPeriod(db, head, id, TODAY);

      expect(await cancelSurveyPeriod(db, head, id, TODAY)).toEqual(
        NOT_RUNNING,
      );
      expect(await stored(db)).toMatchObject({ cancelledAt: null });
    });
  });

  it("refuses a period that is past its last day", async () => {
    await inTestDatabase(async (db) => {
      const { id, head } = await addOpenPeriod(db, {
        startsOn: "2160-09-20",
        endsOn: "2160-10-12",
      });

      expect(await cancelSurveyPeriod(db, head, id, TODAY)).toEqual(
        NOT_RUNNING,
      );
    });
  });

  it("refuses every role but Kepala Unit, and the period stays", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addOpenPeriod(db);
      const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

      for (const role of others) {
        const actor = await addTestEvaluator(db, [role], `Akun Uji ${role}`);

        expect(await cancelSurveyPeriod(db, actor, id, TODAY)).toEqual(
          NOT_ALLOWED_TO_MANAGE,
        );
      }
      expect(await stored(db)).toMatchObject({ cancelledAt: null });
    });
  });

  it("refuses an id that names no period", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addOpenPeriod(db);

      expect(await cancelSurveyPeriod(db, head, UNKNOWN, TODAY)).toEqual(
        NOT_RUNNING,
      );
      expect(await cancelSurveyPeriod(db, head, "", TODAY)).toEqual(
        NOT_RUNNING,
      );
    });
  });
});
