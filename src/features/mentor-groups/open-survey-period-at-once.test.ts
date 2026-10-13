import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { withOwnTestDatabase } from "@/db/test-database-at-once";
import { testSurveyPeriods } from "@/mentoring/test-survey-periods";
import { ALREADY_RUNNING, openSurveyPeriod } from "./open-survey-period";
import type { SurveyPeriodInput } from "./survey-input";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";

/*
 * A survey period is never erased, so no rows are removed after the
 * check: the database is dropped at the end.
 */
const own = withOwnTestDatabase("bukasurvei");

const TODAY = "2164-10-13";

describe("Buka periode evaluasi pressed twice at the same moment", () => {
  it("opens one period: the second save waits, then is refused by the database's own rule, also for other dates and another Periode", async () => {
    const periods = await addTestPeriods(own.db, 2163);
    const head = await addTestEvaluator(own.db, ["head_of_unit"]);
    const input: SurveyPeriodInput = {
      periodId: periods.runningId,
      startsOn: TODAY,
      endsOn: "2164-10-27",
      achievementWeight: 50,
      note: null,
    };
    const other: SurveyPeriodInput = {
      periodId: periods.beforeId,
      startsOn: "2164-12-01",
      endsOn: "2164-12-15",
      achievementWeight: 30,
      note: null,
    };

    const both = await own.atOnce(
      (db) => openSurveyPeriod(db, head, input, TODAY),
      (db) => openSurveyPeriod(db, head, other, TODAY),
    );

    expect(both.sooner).toMatchObject({ ok: true });
    expect(both.later).toEqual(ALREADY_RUNNING);
    const stored = await testSurveyPeriods(own.db);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ periodId: periods.runningId });
  });
});

describe("a button of the survey period pressed twice on the screen", () => {
  const FOLDER = "src/features/mentor-groups";

  /** Every button of a file, as the screen code writes it. */
  function buttonsOf(file: string): string[] {
    const code = readFileSync(`${FOLDER}/${file}`, "utf8");
    return code.match(/<button\b[^>]*>/gs) ?? [];
  }

  it("switches Buka periode evaluasi off while a change is on its way", () => {
    const buttons = buttonsOf("survey-open-form.tsx");

    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toContain("disabled={isSending}");
  });

  it("switches Simpan tanggal, Tutup periode sekarang and Batalkan periode off together", () => {
    const buttons = buttonsOf("survey-controls.tsx");

    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button).toContain("disabled={isSending}");
    }
  });
});
