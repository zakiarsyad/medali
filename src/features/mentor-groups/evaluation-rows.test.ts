import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import { LATEST_EVALUATIONS, listLatestEvaluations } from "./evaluation-rows";
import {
  addTestEvaluation,
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
  TEST_SCORES,
} from "./test-evaluations";
import { addTestEndedGroup, addTestGroup } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2075;
const EVERY_ROW: RowLimit = { kind: "all" };

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

async function addRecords(db: Database) {
  const held = await addTestHeldGroup(db, "UJIBARISEVAL", "Pengasuh Uji Baris");
  const periods = await addTestPeriods(db, YEAR);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Baris");
  return { held, periods, head };
}

describe("listLatestEvaluations", () => {
  it("shows the period, the mentor, the group, the values, the note, when and by whom", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      const at = new Date("2076-10-13T03:00:00Z");
      await addTestEvaluation(db, {
        ...held,
        periodId: periods.runningId,
        evaluatedBy: head.id,
        evaluatedAt: at,
        note: "Catatan uji.",
      });

      const rows = await listLatestEvaluations(
        db,
        onlyPrograms([held.studyProgramId]),
      );

      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        period: { startYear: YEAR + 1, term: "odd" },
        group: {
          cohortYear: 2026,
          entryPath: "regular",
          number: 1,
          programCode: "UJIBARISEVAL",
        },
        mentorName: "Pengasuh Uji Baris",
        ...TEST_SCORES,
        note: "Catatan uji.",
        evaluatedAt: at,
        evaluatorName: "Kepala Uji Baris",
      });
    });
  });

  it("puts the one saved last first", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      const by = { ...held, evaluatedBy: head.id };
      await addTestEvaluation(db, {
        ...by,
        periodId: periods.runningId,
        evaluatedAt: new Date("2076-10-01T03:00:00Z"),
      });
      await addTestEvaluation(db, {
        ...by,
        periodId: periods.beforeId,
        evaluatedAt: new Date("2076-10-05T03:00:00Z"),
      });

      const rows = await listLatestEvaluations(
        db,
        onlyPrograms([held.studyProgramId]),
      );

      expect(rows.map((row) => row.period.term)).toEqual(["even", "odd"]);
    });
  });

  it("shows Ketua Program Studi the evaluations of their program only, and none without a program", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      const other = await addTestHeldGroup(db, "UJIBARISLAIN", "Pengasuh Lain");
      const of = { periodId: periods.runningId, evaluatedBy: head.id };
      await addTestEvaluation(db, { ...held, ...of });
      await addTestEvaluation(db, { ...other, ...of });

      const own = await listLatestEvaluations(
        db,
        onlyPrograms([held.studyProgramId]),
      );
      const none = await listLatestEvaluations(db, onlyPrograms([]));
      const both = await listLatestEvaluations(
        db,
        onlyPrograms([held.studyProgramId, other.studyProgramId]),
      );

      expect(own.map((row) => row.mentorName)).toEqual(["Pengasuh Uji Baris"]);
      expect(none).toEqual([]);
      expect(both).toHaveLength(2);
    });
  });

  it("leaves out the evaluation of a group that is ended", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      const endedId = await addTestEndedGroup(db, held.studyProgramId, {
        number: 2,
      });
      await addTestEvaluation(db, {
        ...held,
        groupId: endedId,
        periodId: periods.runningId,
        evaluatedBy: head.id,
      });

      const rows = await listLatestEvaluations(
        db,
        onlyPrograms([held.studyProgramId]),
      );

      expect(rows).toEqual([]);
    });
  });

  it("shows 20 at most", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      for (let number = 2; number <= LATEST_EVALUATIONS + 3; number += 1) {
        const groupId = await addTestGroup(db, held.studyProgramId, { number });
        await addTestEvaluation(db, {
          ...held,
          groupId,
          periodId: periods.runningId,
          evaluatedBy: head.id,
        });
      }

      const rows = await listLatestEvaluations(db, EVERY_ROW);

      expect(rows).toHaveLength(LATEST_EVALUATIONS);
    });
  });
});
