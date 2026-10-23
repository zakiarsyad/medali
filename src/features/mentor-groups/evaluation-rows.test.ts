// Sample Tahun akademik of this file: 2590 to 2591.
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  LATEST_EVALUATIONS,
  listGroupEvaluations,
  listLatestEvaluations,
  listMentorEvaluations,
} from "./evaluation-rows";
import {
  addTestEvaluation,
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
  addTestSurveyLine,
  TEST_SCORES,
} from "./test-evaluations";
import { addTestEndedGroup, addTestGroup, addTestMentor } from "./test-records";

const inTestDatabase = withTestDatabase();

const YEAR = 2590;
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
      const at = new Date("2591-10-13T03:00:00Z");
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
        evaluatedAt: new Date("2591-10-01T03:00:00Z"),
      });
      await addTestEvaluation(db, {
        ...by,
        periodId: periods.beforeId,
        evaluatedAt: new Date("2591-10-05T03:00:00Z"),
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

describe("listGroupEvaluations and listMentorEvaluations", () => {
  /** Two groups of one program, each evaluated once, of two mentors. */
  async function addTwoEvaluatedGroups(db: Database) {
    const { held, periods, head } = await addRecords(db);
    const secondId = await addTestGroup(db, held.studyProgramId, { number: 2 });
    const otherMentorId = await addTestMentor(db, { name: "Pengasuh Kedua" });
    const of = { periodId: periods.runningId, evaluatedBy: head.id };
    await addTestEvaluation(db, { ...held, ...of });
    await addTestEvaluation(db, {
      ...of,
      groupId: secondId,
      mentorId: otherMentorId,
    });
    const limit = onlyPrograms([held.studyProgramId]);
    return { held, secondId, otherMentorId, limit };
  }

  it("list the evaluations of that group only, and of that mentor only", async () => {
    await inTestDatabase(async (db) => {
      const { held, secondId, otherMentorId, limit } =
        await addTwoEvaluatedGroups(db);

      const ofGroup = await listGroupEvaluations(db, limit, secondId);
      const ofMentor = await listMentorEvaluations(db, limit, held.mentorId);
      const ofOther = await listMentorEvaluations(db, limit, otherMentorId);

      expect(ofGroup.map((row) => row.mentorName)).toEqual(["Pengasuh Kedua"]);
      expect(ofMentor.map((row) => row.group.number)).toEqual([1]);
      expect(ofOther.map((row) => row.group.number)).toEqual([2]);
    });
  });

  it("list nothing to an account whose limit leaves the group out", async () => {
    await inTestDatabase(async (db) => {
      const { held } = await addTwoEvaluatedGroups(db);
      const none = onlyPrograms([]);

      expect(await listGroupEvaluations(db, none, held.groupId)).toEqual([]);
      expect(await listMentorEvaluations(db, none, held.mentorId)).toEqual([]);
    });
  });
});

describe("the lines of the students' survey in the evaluation history", () => {
  it("stand in every list beside the evaluations of Kepala Unit, marked with their source, the one saved last first", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      await addTestEvaluation(db, {
        ...held,
        periodId: periods.beforeId,
        evaluatedBy: head.id,
        evaluatedAt: new Date("2591-03-01T03:00:00Z"),
      });
      const fixedAt = new Date("2591-07-01T03:00:00Z");
      await addTestSurveyLine(db, {
        ...held,
        periodId: periods.beforeId,
        fixedBy: head.id,
        fixedAt,
        score: 65,
      });
      const limit = onlyPrograms([held.studyProgramId]);

      const latest = await listLatestEvaluations(db, limit);
      const ofGroup = await listGroupEvaluations(db, limit, held.groupId);
      const ofMentor = await listMentorEvaluations(db, limit, held.mentorId);

      for (const list of [latest, ofGroup, ofMentor]) {
        expect(list.map((row) => row.source)).toEqual([
          "student_survey",
          "head_of_unit",
        ]);
      }
      expect(latest[0]).toMatchObject({
        period: { startYear: YEAR, term: "even" },
        mentorName: "Pengasuh Uji Baris",
        activity: null,
        attendance: null,
        achievement: 70,
        feedback: 60,
        average: 65,
        respondents: { answered: 3, members: 4 },
        evaluatedAt: fixedAt,
        evaluatorName: "Kepala Uji Baris",
      });
      expect(latest[1]).toMatchObject({ average: 77.5, respondents: null });
    });
  });

  it("are left out for an account whose limit leaves the group out", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head } = await addRecords(db);
      await addTestSurveyLine(db, {
        ...held,
        periodId: periods.beforeId,
        fixedBy: head.id,
        fixedAt: new Date("2591-07-01T03:00:00Z"),
        score: 65,
      });

      expect(await listLatestEvaluations(db, onlyPrograms([]))).toEqual([]);
    });
  });
});
