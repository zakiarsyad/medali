import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { addTestSurveyPeriod } from "@/mentoring/test-survey-periods";
import { readRunningSurveyCard } from "./survey-card";
import { addTestEvaluator, addTestPeriods } from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembersWithStatus,
  addTestProgram,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const START_YEAR = 2155;
const TODAY = "2156-10-13";
const EVERY_ROW: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

/** A survey period of the running academic period, open on TODAY. */
async function addOpenPeriod(
  db: Database,
  more: Partial<Parameters<typeof addTestSurveyPeriod>[1]> = {},
) {
  const periods = await addTestPeriods(db, START_YEAR);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Kartu");
  const id = await addTestSurveyPeriod(db, {
    periodId: periods.runningId,
    openedBy: head.id,
    startsOn: "2156-10-10",
    endsOn: "2156-10-24",
    ...more,
  });
  return { id, head };
}

/**
 * Two programs. The first has a group of three Aktif students, one on
 * Cuti and one Non aktif, and an ended group of two Aktif students. The
 * second has a group of two Aktif students.
 */
async function addGroups(db: Database) {
  const first = await addTestProgram(db, "UJIKARTUSATU");
  const second = await addTestProgram(db, "UJIKARTUDUA");
  const inForce = await addTestGroup(db, first, { number: 1 });
  const ended = await addTestEndedGroup(db, first, { number: 2 });
  const other = await addTestGroup(db, second, { number: 1 });
  await addTestMembersWithStatus(
    db,
    { id: inForce, studyProgramId: first },
    9900025101,
    ["active", "active", "active", "on_leave", "inactive"],
  );
  await addTestMembersWithStatus(
    db,
    { id: ended, studyProgramId: first },
    9900025201,
    ["active", "active"],
  );
  await addTestMembersWithStatus(
    db,
    { id: other, studyProgramId: second },
    9900025301,
    ["active", "active"],
  );
  return { first, second };
}

describe("readRunningSurveyCard", () => {
  it("gives the running period with its Periode, dates, weight, note, who opened it and its status", async () => {
    await inTestDatabase(async (db) => {
      const { id } = await addOpenPeriod(db, {
        achievementWeight: 40,
        note: "Isi sebelum akhir bulan.",
      });

      const card = await readRunningSurveyCard(db, EVERY_ROW, TODAY);

      expect(card).toEqual({
        id,
        period: { startYear: 2156, term: "odd" },
        startsOn: "2156-10-10",
        endsOn: "2156-10-24",
        achievementWeight: 40,
        note: "Isi sebelum akhir bulan.",
        openerName: "Kepala Uji Kartu",
        status: "open",
        respondentPool: 0,
      });
    });
  });

  it("says Terjadwal of a period whose first day lies ahead", async () => {
    await inTestDatabase(async (db) => {
      await addOpenPeriod(db, { startsOn: "2156-10-14" });

      const card = await readRunningSurveyCard(db, EVERY_ROW, TODAY);

      expect(card?.status).toBe("scheduled");
    });
  });

  it("counts as the students who can answer the Aktif members of the groups in force: none on Cuti, none Non aktif, none of an ended group", async () => {
    await inTestDatabase(async (db) => {
      await addOpenPeriod(db);
      const { first, second } = await addGroups(db);

      const card = await readRunningSurveyCard(
        db,
        onlyPrograms([first]),
        TODAY,
      );
      const both = await readRunningSurveyCard(
        db,
        onlyPrograms([first, second]),
        TODAY,
      );

      expect(card?.respondentPool).toBe(3);
      expect(both?.respondentPool).toBe(5);
    });
  });

  it("counts for Ketua Program Studi the students of their program only, and none without a program", async () => {
    await inTestDatabase(async (db) => {
      await addOpenPeriod(db);
      const { second } = await addGroups(db);
      const noProgram = onlyPrograms([]);

      const own = await readRunningSurveyCard(
        db,
        onlyPrograms([second]),
        TODAY,
      );
      const none = await readRunningSurveyCard(db, noProgram, TODAY);

      expect(own?.respondentPool).toBe(2);
      expect(none?.respondentPool).toBe(0);
    });
  });

  it("gives nothing once the period is past its last day", async () => {
    await inTestDatabase(async (db) => {
      await addOpenPeriod(db, { startsOn: "2156-09-20", endsOn: "2156-10-12" });

      expect(await readRunningSurveyCard(db, EVERY_ROW, TODAY)).toBe(null);
    });
  });

  it("gives nothing once the period is closed by hand or cancelled", async () => {
    await inTestDatabase(async (db) => {
      const periods = await addTestPeriods(db, START_YEAR);
      const head = await addTestEvaluator(db, ["head_of_unit"]);
      const days = { startsOn: "2156-10-10", endsOn: "2156-10-24" };
      const stamp = new Date();
      await addTestSurveyPeriod(db, {
        periodId: periods.runningId,
        openedBy: head.id,
        closedBy: head.id,
        closedAt: stamp,
        ...days,
      });
      await addTestSurveyPeriod(db, {
        periodId: periods.runningId,
        openedBy: head.id,
        cancelledBy: head.id,
        cancelledAt: stamp,
        ...days,
      });

      expect(await readRunningSurveyCard(db, EVERY_ROW, TODAY)).toBe(null);
    });
  });
});
