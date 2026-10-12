import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { RoleId } from "@/auth/role-ids";
import type { Database } from "@/db/connect";
import {
  accountRoles,
  cohortAssignmentGroups,
  cohortAssignments,
  students,
} from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { ASK_FOR_DAY, ASK_FOR_NUMBER } from "./decree-input";
import { fixAssignment } from "./fix-assignment";
import { ALREADY_FIXED, DRAFT_CHANGED, NOT_ALLOWED_TO_FIX } from "./refusals";
import { addCompleteTestDraft, addTestDraft, testDraftOf } from "./test-drafts";
import { testLiveGroupsOf } from "./test-live-groups";
import {
  addTestActor,
  addTestGroupMembers,
  addTestLiveGroup,
  addTestMentorOfToday,
} from "./test-records";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

const inTestDatabase = withTestDatabase();

const YEAR = 2052;
const DECREE = { decreeNumber: "KEP-52/UJI/2052", effectiveOn: "2052-09-01" };
/** A complete draft stands at version 2: formed, then its mentors filled. */
const INPUT = { cohortYear: YEAR, version: 2, ...DECREE };

/** A complete draft and the Kepala Unit who fixes it. */
async function addDraftAndHead(db: Database) {
  const draft = await addCompleteTestDraft(db, YEAR, "UJITETAP");
  const head = await addTestActor(db, ["head_of_unit"], "Kepala Uji Tetap");
  return { ...draft, head };
}

/** Each group of the draft as the kelompok it must become. */
async function expectedLiveGroups(db: Database) {
  const draft = await testDraftOf(db, YEAR);
  return draft.groups.map((group) => ({
    studyProgramId: group.studyProgramId,
    number: group.number,
    startsOn: DECREE.effectiveOn,
    endedAt: null,
    mentors: [{ mentorId: group.mentor?.id, startsOn: DECREE.effectiveOn }],
    studentIds: group.members.map((member) => member.id).sort(),
  }));
}

async function expectNothingFixed(db: Database, liveGroups = 0) {
  const draft = await testDraftOf(db, YEAR);
  expect(draft.status).not.toBe("fixed");
  expect(draft.log.map((line) => line.action)).not.toContain("fixed");
  expect(await testLiveGroupsOf(db, YEAR)).toHaveLength(liveGroups);
}

describe("fixAssignment", () => {
  it("makes the groups of the draft the kelompok in force, each with its members and its mentor from Berlaku mulai", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftAndHead(db);
      const expected = await expectedLiveGroups(db);

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed).toEqual({ ok: true, value: null });
      const live = await testLiveGroupsOf(db, YEAR);
      expect(live).toHaveLength(3);
      for (const group of expected) {
        expect(live).toContainEqual(expect.objectContaining(group));
      }
      expect(await readWaitingStudents(db, EVERY_ROW, YEAR)).toEqual([]);
    });
  });

  it("keeps the decree number and the day, says who fixed it, and names the kelompok each group became", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftAndHead(db);

      await fixAssignment(db, head, INPUT);

      const draft = await testDraftOf(db, YEAR);
      expect(draft).toMatchObject({
        status: "fixed",
        version: 3,
        savedBy: "Kepala Uji Tetap",
        ...DECREE,
      });
      expect(draft.log.map((line) => [line.action, line.by])).toContainEqual([
        "fixed",
        "Kepala Uji Tetap",
      ]);
      const liveIds = (await testLiveGroupsOf(db, YEAR)).map((g) => g.id);
      const named = await db
        .select({ liveId: cohortAssignmentGroups.mentorGroupId })
        .from(cohortAssignmentGroups)
        .where(eq(cohortAssignmentGroups.assignmentId, draft.id));
      expect(named.map((group) => group.liveId).sort()).toEqual(liveIds.sort());
    });
  });

  it.each(["submitted", "cancelled"] as const)(
    "fixes a %s penetapan as well",
    async (status) => {
      await inTestDatabase(async (db) => {
        const { head } = await addDraftAndHead(db);
        await db
          .update(cohortAssignments)
          .set({ status })
          .where(eq(cohortAssignments.cohortYear, YEAR));

        const fixed = await fixAssignment(db, head, INPUT);

        expect(fixed.ok).toBe(true);
        expect(await testDraftOf(db, YEAR)).toMatchObject({ status: "fixed" });
      });
    },
  );

  it("does nothing without a decree number or without the day, and asks for it", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftAndHead(db);

      const noNumber = await fixAssignment(db, head, {
        ...INPUT,
        decreeNumber: null,
      });
      const noDay = await fixAssignment(db, head, {
        ...INPUT,
        effectiveOn: null,
      });

      expect(noNumber).toEqual({ ok: false, error: ASK_FOR_NUMBER });
      expect(noDay).toEqual({ ok: false, error: ASK_FOR_DAY });
      await expectNothingFixed(db);
      expect(await testDraftOf(db, YEAR)).toMatchObject({ version: 2 });
    });
  });

  it("refuses a draft with a group without a mentor, sent past the switched-off button", async () => {
    await inTestDatabase(async (db) => {
      await addTestDraft(db, YEAR, "UJITETAP");
      const head = await addTestActor(db, ["head_of_unit"]);

      const fixed = await fixAssignment(db, head, { ...INPUT, version: 1 });

      expect(fixed).toEqual({
        ok: false,
        error:
          "Draf belum bisa diajukan atau ditetapkan. 3 kelompok belum punya pengasuh.",
      });
      await expectNothingFixed(db);
    });
  });

  it("refuses a fix made from an older draft, and a second fix", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftAndHead(db);

      const stale = await fixAssignment(db, head, { ...INPUT, version: 1 });
      await expectNothingFixed(db);
      await fixAssignment(db, head, INPUT);
      const again = await fixAssignment(db, head, { ...INPUT, version: 3 });

      expect(stale).toEqual(DRAFT_CHANGED);
      expect(again).toEqual(ALREADY_FIXED);
      expect(await testLiveGroupsOf(db, YEAR)).toHaveLength(3);
    });
  });

  it.each<RoleId>([
    "upk_staff",
    "director",
    "head_of_program",
    "mentor",
    "student",
  ])("refuses %s, and fixes nothing", async (role) => {
    await inTestDatabase(async (db) => {
      await addCompleteTestDraft(db, YEAR, "UJITETAP");
      const other = await addTestActor(db, [role], "Akun Uji Ditolak");

      expect(await fixAssignment(db, other, INPUT)).toEqual(NOT_ALLOWED_TO_FIX);
      await expectNothingFixed(db);
    });
  });
});

describe("fixAssignment, when something changed after the draft was saved", () => {
  it("refuses when a member got a kelompok some other way", async () => {
    await inTestDatabase(async (db) => {
      const { head, large } = await addDraftAndHead(db);
      const [group] = (await testDraftOf(db, YEAR)).groups;
      const member = group?.members[0]?.id ?? "";
      const other = await addTestLiveGroup(db, large, {
        cohortYear: YEAR,
        number: 9,
      });
      await addTestGroupMembers(db, other, [member]);

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed.ok).toBe(false);
      expect(fixed).toMatchObject({
        error: expect.stringContaining("1 mahasiswa pada draf"),
      });
      await expectNothingFixed(db, 1);
    });
  });

  it("refuses when a member moved to another angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftAndHead(db);
      const [group] = (await testDraftOf(db, YEAR)).groups;
      const moved = group?.members.slice(0, 2).map((m) => m.id) ?? [];
      for (const id of moved) {
        await db
          .update(students)
          .set({ cohortYear: YEAR - 1 })
          .where(eq(students.id, id));
      }

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed).toMatchObject({
        ok: false,
        error: expect.stringContaining("2 mahasiswa pada draf"),
      });
      await expectNothingFixed(db);
    });
  });

  it("refuses when a chosen mentor took a group of another angkatan", async () => {
    await inTestDatabase(async (db) => {
      const { head, large } = await addDraftAndHead(db);
      const [group] = (await testDraftOf(db, YEAR)).groups;
      const other = await addTestLiveGroup(db, large, { cohortYear: YEAR - 1 });
      await addTestMentorOfToday(db, other, group?.mentor?.id ?? "");

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed).toMatchObject({
        ok: false,
        error: expect.stringContaining("1 pengasuh pada draf"),
      });
      await expectNothingFixed(db);
    });
  });

  it("refuses when a chosen mentor became Tidak aktif", async () => {
    await inTestDatabase(async (db) => {
      const { head } = await addDraftAndHead(db);
      const [group] = (await testDraftOf(db, YEAR)).groups;
      await db
        .delete(accountRoles)
        .where(eq(accountRoles.accountId, group?.mentor?.id ?? ""));

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed).toMatchObject({
        ok: false,
        error: expect.stringContaining("1 pengasuh pada draf"),
      });
      await expectNothingFixed(db);
    });
  });

  it("refuses when a group in force took the number of a group of the draft", async () => {
    await inTestDatabase(async (db) => {
      const { head, large } = await addDraftAndHead(db);
      await addTestLiveGroup(db, large, { cohortYear: YEAR, number: 2 });

      const fixed = await fixAssignment(db, head, INPUT);

      expect(fixed).toMatchObject({
        ok: false,
        error: expect.stringContaining("1 kelompok pada draf"),
      });
      await expectNothingFixed(db, 1);
    });
  });
});
