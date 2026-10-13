import { describe, expect, it } from "vitest";
import { ROLE_IDS } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { withTestDatabase } from "@/db/test-database";
import {
  addTestReplacement,
  testMentorLinesOf,
  testReplacementsOf,
} from "@/mentoring/test-replacements";
import { readLastGroupEvaluations } from "./last-evaluations";
import { readMentor } from "./mentor-detail";
import type { ReplacementInput } from "./replacement-input";
import { GROUP_NOT_FOUND } from "./save-evaluation";
import {
  NEEDS_POOR_EVALUATION,
  NO_MENTOR_TO_REPLACE,
  NOT_A_SPARE_MENTOR,
  NOT_ALLOWED_TO_REPLACE,
  STARTS_BEFORE_TODAY,
  saveReplacement,
  startsBeforeOldMentor,
} from "./save-replacement";
import {
  addTestEvaluation,
  addTestEvaluator,
  addTestHeldGroup,
  addTestPeriods,
} from "./test-evaluations";
import {
  addTestEndedGroup,
  addTestGroup,
  addTestMentor,
  addTestMentorLine,
  addTestMentorRole,
  TEST_GROUP_STARTS_ON,
} from "./test-records";

const inTestDatabase = withTestDatabase();

const PROGRAM = "UJISIMPANGANTI";
const TODAY = "2082-10-13";
const LATER = "2082-11-02";
const POOR = { activity: 50, attendance: 60, achievement: 55, feedback: 60 };

async function addSpare(db: Database, name: string): Promise<string> {
  const id = await addTestMentor(db, { name });
  await addTestMentorRole(db, id);
  return id;
}

/** A held group, a spare mentor, Kepala Unit, and what they send for a later day. */
async function addGroupToReplace(db: Database) {
  const group = await addTestHeldGroup(db, PROGRAM, "Pengasuh Uji Lama");
  const newMentorId = await addSpare(db, "Pengasuh Uji Baru");
  const head = await addTestEvaluator(db, ["head_of_unit"], "Kepala Uji Ganti");
  const input: ReplacementInput = {
    groupId: group.groupId,
    reason: "own_request",
    startsOn: LATER,
    newMentorId,
    letterNumber: "ND-12/PKN/2082",
    oldMentorStatus: "reserve",
    note: "Atas permintaan yang bersangkutan.",
  };
  return { ...group, newMentorId, head, input };
}

describe("saveReplacement", () => {
  it("keeps the group, both mentors, the day, the reason, the letter, the status, the note, who set it and when", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const before = new Date();

      const saved = await saveReplacement(db, made.head, made.input, TODAY);

      const [stored, ...others] = await testReplacementsOf(db, made.groupId);
      expect(others).toEqual([]);
      expect(saved).toEqual({
        ok: true,
        value: {
          id: stored?.id,
          group: {
            cohortYear: 2026,
            entryPath: "regular",
            number: 1,
            programCode: PROGRAM,
          },
          newMentorName: "Pengasuh Uji Baru",
          startsOn: LATER,
          isInForce: false,
        },
      });
      expect(stored).toMatchObject({
        ...made.input,
        oldMentorId: made.mentorId,
        setBy: made.head.id,
        carriedOutAt: null,
        cancelledBy: null,
        cancelledAt: null,
      });
      expect(stored?.setAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime() - 1000,
      );
    });
  });

  it("changes nothing for the group while a replacement waits for a later date", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);

      await saveReplacement(db, made.head, made.input, TODAY);

      expect(await testMentorLinesOf(db, made.groupId)).toEqual([
        {
          mentorId: made.mentorId,
          startsOn: TEST_GROUP_STARTS_ON,
          endsOn: null,
          endReason: null,
        },
      ]);
    });
  });

  it("gives the group its new mentor at once when it starts today: the old line ends and the new one starts that day", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const input = { ...made.input, startsOn: TODAY };

      const saved = await saveReplacement(db, made.head, input, TODAY);

      expect(saved).toMatchObject({
        ok: true,
        value: { newMentorName: "Pengasuh Uji Baru", isInForce: true },
      });
      const [stored] = await testReplacementsOf(db, made.groupId);
      expect(stored?.carriedOutAt).toBeInstanceOf(Date);
      expect(await testMentorLinesOf(db, made.groupId)).toEqual([
        {
          mentorId: made.mentorId,
          startsOn: TEST_GROUP_STARTS_ON,
          endsOn: TODAY,
          endReason: "Permintaan sendiri",
        },
        {
          mentorId: made.newMentorId,
          startsOn: TODAY,
          endsOn: null,
          endReason: null,
        },
      ]);
    });
  });

  it("shows the old mentor as Cadangan or Tidak aktif, and the new one as Mengasuh, once it is in force", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const input = {
        ...made.input,
        startsOn: TODAY,
        reason: "study_leave",
        oldMentorStatus: "inactive",
      } as const;
      await addTestMentorRole(db, made.mentorId);

      await saveReplacement(db, made.head, input, TODAY);

      const everyone = { kind: "all" } as const;
      const old = await readMentor(db, everyone, made.mentorId, null);
      const next = await readMentor(db, everyone, made.newMentorId, null);
      expect(old).toMatchObject({
        mentor: {
          status: "inactive",
          inactiveSince: TODAY,
          inactiveReason: "Tugas belajar",
          groups: [],
        },
      });
      expect(next).toMatchObject({
        mentor: { status: "mentoring", groups: [{ id: made.groupId }] },
      });
    });
  });

  it("leaves a replaced group without Evaluasi terakhir until its new mentor is evaluated", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const periods = await addTestPeriods(db, 2081);
      await addTestEvaluation(db, {
        groupId: made.groupId,
        mentorId: made.mentorId,
        periodId: periods.runningId,
        evaluatedBy: made.head.id,
      });
      const everyone = { kind: "all" } as const;
      const groupIds = [made.groupId];
      const before = await readLastGroupEvaluations(db, everyone, groupIds);

      const input = { ...made.input, startsOn: TODAY };
      await saveReplacement(db, made.head, input, TODAY);

      const after = await readLastGroupEvaluations(db, everyone, groupIds);
      expect(before.size).toBe(1);
      expect(after.size).toBe(0);
    });
  });

  it("refuses a start date before the day the mentor of today took the group", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const input = { ...made.input, startsOn: "2026-08-31" };

      const saved = await saveReplacement(db, made.head, input, "2026-08-30");

      expect(saved).toEqual(startsBeforeOldMentor(TEST_GROUP_STARTS_ON));
      expect(await testReplacementsOf(db, made.groupId)).toEqual([]);
    });
  });

  it("is refused for every role but Kepala Unit, and nothing is kept", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const others = ROLE_IDS.filter((role) => role !== "head_of_unit");

      for (const role of others) {
        const actor = { ...made.head, roles: [role] };
        const saved = await saveReplacement(db, actor, made.input, TODAY);
        expect(saved).toEqual(NOT_ALLOWED_TO_REPLACE);
      }

      expect(await testReplacementsOf(db, made.groupId)).toEqual([]);
    });
  });

  it("refuses a start date before today, by the day on campus", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const input = { ...made.input, startsOn: "2082-10-12" };

      expect(await saveReplacement(db, made.head, input, TODAY)).toEqual(
        STARTS_BEFORE_TODAY,
      );
      expect(await testReplacementsOf(db, made.groupId)).toEqual([]);
    });
  });

  it("refuses a group that is not there, one that is ended, and one without a mentor", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const ended = await addTestEndedGroup(db, made.studyProgramId, {
        number: 2,
      });
      await addTestMentorLine(db, ended, made.mentorId);
      const empty = await addTestGroup(db, made.studyProgramId, { number: 3 });
      const send = (groupId: string) =>
        saveReplacement(db, made.head, { ...made.input, groupId }, TODAY);

      expect(await send(made.newMentorId)).toEqual(GROUP_NOT_FOUND);
      expect(await send(ended)).toEqual(GROUP_NOT_FOUND);
      expect(await send(empty)).toEqual(NO_MENTOR_TO_REPLACE);
    });
  });

  it("refuses a new mentor who holds a group, has no Pengasuh role, or was set Tidak aktif", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const noRole = await addTestMentor(db, { name: "Pengasuh Uji Tanpa" });
      const retired = await addSpare(db, "Pengasuh Uji Pensiun");
      const otherGroup = await addTestGroup(db, made.studyProgramId, {
        number: 2,
      });
      await addTestReplacement(db, {
        groupId: otherGroup,
        oldMentorId: retired,
        newMentorId: noRole,
        oldMentorStatus: "inactive",
        carriedOutAt: new Date(),
      });
      const send = (newMentorId: string) =>
        saveReplacement(db, made.head, { ...made.input, newMentorId }, TODAY);

      expect(await send(made.mentorId)).toEqual(NOT_A_SPARE_MENTOR);
      expect(await send(noRole)).toEqual(NOT_A_SPARE_MENTOR);
      expect(await send(retired)).toEqual(NOT_A_SPARE_MENTOR);
      expect(await testReplacementsOf(db, made.groupId)).toEqual([]);
    });
  });

  it("refuses Hasil evaluasi kurang while the mentor has no evaluation, or the last one is not Kurang", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const periods = await addTestPeriods(db, 2081);
      const input = { ...made.input, reason: "poor_evaluation" } as const;

      const without = await saveReplacement(db, made.head, input, TODAY);
      await addTestEvaluation(db, {
        groupId: made.groupId,
        mentorId: made.mentorId,
        periodId: periods.runningId,
        evaluatedBy: made.head.id,
      });
      const withFair = await saveReplacement(db, made.head, input, TODAY);

      expect(without).toEqual(NEEDS_POOR_EVALUATION);
      expect(withFair).toEqual(NEEDS_POOR_EVALUATION);
    });
  });

  it("takes Hasil evaluasi kurang once the mentor's last evaluation for the group is Kurang", async () => {
    await inTestDatabase(async (db) => {
      const made = await addGroupToReplace(db);
      const periods = await addTestPeriods(db, 2081);
      await addTestEvaluation(db, {
        groupId: made.groupId,
        mentorId: made.mentorId,
        periodId: periods.runningId,
        evaluatedBy: made.head.id,
        ...POOR,
      });
      const input = { ...made.input, reason: "poor_evaluation" } as const;

      const saved = await saveReplacement(db, made.head, input, TODAY);

      expect(saved).toMatchObject({ ok: true });
    });
  });
});
