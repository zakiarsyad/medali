import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RowLimit } from "@/auth/access";
import type { Database } from "@/db/connect";
import { mentorGroupMentors } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { readEvaluatedGroup } from "./evaluated-group";
import { choicesByCohort, listEvaluationChoices } from "./evaluation-choices";
import {
  addTestEvaluation,
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
  TEST_SCORES,
} from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMembersWithStatus,
  addTestMentor,
  addTestMentorLine,
  TEST_GROUP_STARTS_ON,
} from "./test-records";

/* The sample NIMs of this file: 9977000001 to 9977000099. */

const inTestDatabase = withTestDatabase();

const YEAR = 2077;
const PROGRAM = "UJIPILIHEVAL";
const MENTOR = "Pengasuh Uji Pilih Evaluasi";

function onlyPrograms(studyProgramIds: number[]): RowLimit {
  return { kind: "some", studyProgramIds, menteesOf: [], studentIds: [] };
}

async function addRecords(db: Database) {
  const held = await addTestHeldGroup(db, PROGRAM, MENTOR);
  const periods = await addTestPeriods(db, YEAR);
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Pilih");
  const offered = [periods.runningId, periods.beforeId];
  return {
    held,
    periods,
    head,
    offered,
    limit: onlyPrograms([held.studyProgramId]),
  };
}

describe("listEvaluationChoices", () => {
  it("offers the groups in force an account may see, the newest angkatan first, each with its mentor of today", async () => {
    await inTestDatabase(async (db) => {
      const { held, limit } = await addRecords(db);
      await addTestGroup(db, held.studyProgramId, { cohortYear: 2027 });
      await addTestGroup(db, held.studyProgramId, { number: 2 });
      await addTestEndedGroup(db, held.studyProgramId, { number: 3 });
      await addTestHeldGroup(db, "UJIPILIHLAIN", "Pengasuh Program Lain");

      const choices = await listEvaluationChoices(db, limit);

      expect(
        choices.map(({ cohortYear, number, mentorName }) => ({
          cohortYear,
          number,
          mentorName,
        })),
      ).toEqual([
        { cohortYear: 2027, number: 1, mentorName: null },
        { cohortYear: 2026, number: 1, mentorName: MENTOR },
        { cohortYear: 2026, number: 2, mentorName: null },
      ]);
      expect(
        choicesByCohort(choices).map((cohort) => cohort.cohortYear),
      ).toEqual([2027, 2026]);
      expect(choicesByCohort(choices)[1]?.groups).toHaveLength(2);
    });
  });

  it("offers nothing to an account without a program studi", async () => {
    await inTestDatabase(async (db) => {
      await addRecords(db);

      expect(await listEvaluationChoices(db, onlyPrograms([]))).toEqual([]);
    });
  });
});

describe("readEvaluatedGroup", () => {
  it("gives the mentor of today, since when, and how many Aktif members", async () => {
    await inTestDatabase(async (db) => {
      const { held, offered, limit } = await addRecords(db);
      await addTestMembersWithStatus(
        db,
        { id: held.groupId, studyProgramId: held.studyProgramId },
        9977000001,
        ["active", "active", "on_leave", "inactive"],
      );

      const group = await readEvaluatedGroup(db, limit, held.groupId, offered);

      expect(group).toMatchObject({
        id: held.groupId,
        programCode: PROGRAM,
        mentor: {
          id: held.mentorId,
          name: MENTOR,
          since: TEST_GROUP_STARTS_ON,
        },
        members: 2,
        last: null,
        stored: [],
      });
    });
  });

  it("gives what is saved for the periods asked for, and the evaluation of the latest period as the last", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head, offered, limit } = await addRecords(db);
      const by = { ...held, evaluatedBy: head.id };
      await addTestEvaluation(db, {
        ...by,
        periodId: periods.runningId,
        activity: 40,
        note: "Berjalan.",
        evaluatedAt: new Date("2078-10-01T03:00:00Z"),
      });
      await addTestEvaluation(db, {
        ...by,
        periodId: periods.beforeId,
        evaluatedAt: new Date("2078-10-05T03:00:00Z"),
      });
      await addTestEvaluation(db, { ...by, periodId: periods.olderId });

      const group = await readEvaluatedGroup(db, limit, held.groupId, offered);

      expect(group?.last).toEqual({ ...TEST_SCORES, activity: 40 });
      expect(group?.stored).toHaveLength(2);
      expect(group?.stored).toContainEqual({
        periodId: periods.runningId,
        ...TEST_SCORES,
        activity: 40,
        note: "Berjalan.",
      });
    });
  });

  it("shows nothing of the evaluation of an earlier mentor", async () => {
    await inTestDatabase(async (db) => {
      const { held, periods, head, offered, limit } = await addRecords(db);
      await addTestEvaluation(db, {
        ...held,
        evaluatedBy: head.id,
        periodId: periods.runningId,
      });
      await db
        .update(mentorGroupMentors)
        .set({ endsOn: "2026-12-31", endReason: "Mutasi" })
        .where(eq(mentorGroupMentors.groupId, held.groupId));
      const nextId = await addTestMentor(db, {
        name: "Pengasuh Uji Pengganti",
      });
      await addTestMentorLine(db, held.groupId, nextId, {
        startsOn: "2027-01-01",
      });

      const group = await readEvaluatedGroup(db, limit, held.groupId, offered);

      expect(group).toMatchObject({
        mentor: { id: nextId },
        last: null,
        stored: [],
      });
    });
  });

  it("gives a group without a mentor of today, with no mentor", async () => {
    await inTestDatabase(async (db) => {
      const { held, offered, limit } = await addRecords(db);
      const bareId = await addTestGroup(db, held.studyProgramId, { number: 2 });

      const group = await readEvaluatedGroup(db, limit, bareId, offered);

      expect(group).toMatchObject({ id: bareId, mentor: null, last: null });
    });
  });

  it("gives nothing for a group outside the limit, an ended group, or what is no id", async () => {
    await inTestDatabase(async (db) => {
      const { held, offered, limit } = await addRecords(db);
      const endedId = await addTestEndedGroup(db, held.studyProgramId, {
        number: 2,
      });
      const other = await addTestHeldGroup(db, "UJIPILIHLUAR", "Pengasuh Luar");

      expect(
        await readEvaluatedGroup(db, limit, other.groupId, offered),
      ).toBeNull();
      expect(await readEvaluatedGroup(db, limit, endedId, offered)).toBeNull();
      expect(
        await readEvaluatedGroup(db, limit, "kelompok", offered),
      ).toBeNull();
    });
  });
});
