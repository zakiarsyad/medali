import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import { cohortAssignmentGroups } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelAssignment } from "./cancel-assignment";
import { fixAssignment } from "./fix-assignment";
import {
  DRAFT_CHANGED,
  NO_DRAFT,
  NOT_ALLOWED_TO_FIX,
  NOT_FIXED,
} from "./refusals";
import { saveDecree } from "./save-decree";
import { addCompleteTestDraft, testDraftOf } from "./test-drafts";
import { testLiveGroupsOf } from "./test-live-groups";
import { addTestActor } from "./test-records";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

const inTestDatabase = withTestDatabase();

const YEAR = 2054;
const FIRST_NIM = 9960000001;
const DECREE = { decreeNumber: "KEP-54/UJI/2054", effectiveOn: "2054-09-01" };
/** A fixed penetapan stands at version 3: formed, mentors filled, fixed. */
const KEY = { cohortYear: YEAR, version: 3 };

/** A fixed penetapan of 80 students in 3 groups, and who fixed it. */
async function addFixed(db: Database) {
  await addCompleteTestDraft(db, YEAR, FIRST_NIM, "UJIBATAL");
  const head = await addTestActor(db, ["head_of_unit"], "Kepala Uji Batal");
  const fixed = await fixAssignment(db, head, {
    cohortYear: YEAR,
    version: 2,
    ...DECREE,
  });
  if (!fixed.ok) throw new Error(fixed.error);
  return head;
}

/** What the draft holds of each group: its mentor and its members. */
async function savedGroups(db: Database) {
  const draft = await testDraftOf(db, YEAR);
  return draft.groups.map((group) => ({
    number: group.number,
    mentorId: group.mentor?.id,
    studentIds: group.members.map((member) => member.id).sort(),
  }));
}

async function expectStillFixed(db: Database) {
  expect(await testDraftOf(db, YEAR)).toMatchObject({
    status: "fixed",
    version: 3,
  });
  const live = await testLiveGroupsOf(db, YEAR);
  expect(live.map((group) => group.endedAt)).toEqual([null, null, null]);
  expect(await readWaitingStudents(db, EVERY_ROW, YEAR)).toEqual([]);
}

describe("cancelAssignment", () => {
  it("ends the groups in force with who and when, erases none, and keeps who their members were", async () => {
    await inTestDatabase(async (db) => {
      const head = await addFixed(db);
      const before = await testLiveGroupsOf(db, YEAR);

      const cancelled = await cancelAssignment(db, head, KEY);

      expect(cancelled).toEqual({ ok: true, value: null });
      const after = await testLiveGroupsOf(db, YEAR);
      expect(after).toHaveLength(3);
      for (const group of after) {
        const was = before.find((one) => one.id === group.id);
        expect(group.endedAt).toBeInstanceOf(Date);
        expect(group.endedBy).toBe(head.id);
        expect(group.studentIds).toEqual([]);
        expect(group.pastStudentIds).toEqual(was?.studentIds);
        expect(group.pastStudentIds.length).toBeGreaterThan(0);
        expect(group.mentors).toEqual(was?.mentors);
      }
    });
  });

  it("gives the students back to having no group", async () => {
    await inTestDatabase(async (db) => {
      const head = await addFixed(db);
      expect(await readWaitingStudents(db, EVERY_ROW, YEAR)).toEqual([]);

      await cancelAssignment(db, head, KEY);

      expect(await readWaitingStudents(db, EVERY_ROW, YEAR)).toHaveLength(80);
    });
  });

  it("makes the status Dibatalkan, adds the line to the log, and keeps the groups and mentors as a draft", async () => {
    await inTestDatabase(async (db) => {
      const head = await addFixed(db);
      const saved = await savedGroups(db);

      await cancelAssignment(db, head, KEY);

      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({
        status: "cancelled",
        version: 4,
        savedBy: "Kepala Uji Batal",
        ...DECREE,
      });
      expect(draft.log.map((line) => [line.action, line.by])).toContainEqual([
        "cancelled",
        "Kepala Uji Batal",
      ]);
      expect(draft.log).toHaveLength(4);
      expect(await savedGroups(db)).toEqual(saved);
      const named = await db
        .select({ liveId: cohortAssignmentGroups.mentorGroupId })
        .from(cohortAssignmentGroups)
        .where(eq(cohortAssignmentGroups.assignmentId, draft.id));
      expect(named.map((group) => group.liveId)).toEqual([null, null, null]);
    });
  });

  it("leaves a draft that is changed and fixed again, its numbers not clashing with the ended groups", async () => {
    await inTestDatabase(async (db) => {
      const head = await addFixed(db);
      await cancelAssignment(db, head, KEY);

      const saved = await saveDecree(db, head, {
        cohortYear: YEAR,
        version: 4,
        decreeNumber: "KEP-55/UJI/2054",
        effectiveOn: "2054-10-01",
      });
      expect(saved.ok).toBe(true);
      expect(await testDraftOf(db, YEAR)).toMatchObject({ status: "draft" });
      const fixed = await fixAssignment(db, head, {
        cohortYear: YEAR,
        version: 5,
        decreeNumber: "KEP-55/UJI/2054",
        effectiveOn: "2054-10-01",
      });

      expect(fixed).toEqual({ ok: true, value: null });
      const groups = await testLiveGroupsOf(db, YEAR);
      const ended = groups.filter((group) => group.endedAt !== null);
      const live = groups.filter((group) => group.endedAt === null);
      const place = (group: (typeof groups)[number]) =>
        `${group.studyProgramId}-${group.number}`;
      expect(ended).toHaveLength(3);
      expect(live).toHaveLength(3);
      expect(live.map(place).sort()).toEqual(ended.map(place).sort());
      expect(live.map((group) => group.startsOn)).toEqual([
        "2054-10-01",
        "2054-10-01",
        "2054-10-01",
      ]);
      expect(await readWaitingStudents(db, EVERY_ROW, YEAR)).toEqual([]);
    });
  });

  it("fixes a cancelled penetapan again at once, without a change between", async () => {
    await inTestDatabase(async (db) => {
      const head = await addFixed(db);
      await cancelAssignment(db, head, KEY);

      const fixed = await fixAssignment(db, head, {
        cohortYear: YEAR,
        version: 4,
        ...DECREE,
      });

      expect(fixed.ok).toBe(true);
      expect(await testDraftOf(db, YEAR)).toMatchObject({ status: "fixed" });
    });
  });

  it("refuses an angkatan that is not fixed, one without a penetapan and a cancel sent from an older version", async () => {
    await inTestDatabase(async (db) => {
      const head = await addFixed(db);

      const stale = await cancelAssignment(db, head, { ...KEY, version: 2 });
      const unformed = await cancelAssignment(db, head, {
        ...KEY,
        cohortYear: YEAR + 20,
      });
      await expectStillFixed(db);
      await cancelAssignment(db, head, KEY);
      const again = await cancelAssignment(db, head, { ...KEY, version: 4 });

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(unformed).toEqual(NO_DRAFT);
      expect(again).toEqual(NOT_FIXED);
      expect((await testDraftOf(db, YEAR)).log).toHaveLength(4);
    });
  });

  it.each<RoleId>([
    "upk_staff",
    "director",
    "head_of_program",
    "mentor",
    "student",
  ])("refuses %s, and ends nothing", async (role) => {
    await inTestDatabase(async (db) => {
      await addFixed(db);
      const other = await addTestActor(db, [role], "Akun Uji Ditolak");

      expect(await cancelAssignment(db, other, KEY)).toEqual(
        NOT_ALLOWED_TO_FIX,
      );
      await expectStillFixed(db);
    });
  });
});
