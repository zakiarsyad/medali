import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Database } from "@/db/connect";
import { cohortAssignmentMembers, students } from "@/db/schema";
import { withTestDatabase } from "@/db/test-database";
import { cancelAssignment } from "./cancel-assignment";
import { fixAssignment } from "./fix-assignment";
import {
  addFixedTestDraft,
  addTestDraft,
  testDraftOf,
  testGroupsOf,
} from "./test-drafts";
import {
  placeTestMember,
  testLiveGroupsOf,
  testLiveIdOf,
} from "./test-live-groups";
import { addTestStudents } from "./test-records";
import { EVERY_ROW } from "./visible-assignments";
import { readWaitingStudents } from "./waiting-students";

const inTestDatabase = withTestDatabase();

const YEAR = 2068;
const FIRST_NIM = 9968000001;
const LATE_NIM = 9968000201;
const OTHER_YEAR = 2069;
const OTHER_FIRST_NIM = 9969000001;
/** A fixed penetapan stands at version 3: formed, mentors filled, fixed. */
const KEY = { cohortYear: YEAR, version: 3 };

/**
 * A fixed penetapan whose groups were changed on Pengguna baru mahasiswa
 * since: a late student was put into the first group, a student of the
 * first group was moved to the second, and one was taken out of it.
 */
async function addChangedSinceFixed(db: Database) {
  const draft = await addFixedTestDraft(db, YEAR, FIRST_NIM, "UJITETAP");
  const [first, second] = await testGroupsOf(db, YEAR, draft.large);
  const [moved, out] = first?.members ?? [];
  if (!first || !second || !moved || !out) {
    throw new Error("No group was fixed.");
  }
  const [late] = await addTestStudents(db, draft.large, 1, LATE_NIM, {
    cohortYear: YEAR,
  });
  if (!late) throw new Error("The late student was not added.");
  await placeTestMember(db, late, await testLiveIdOf(db, first.id));
  await placeTestMember(db, moved.id, await testLiveIdOf(db, second.id));
  await placeTestMember(db, out.id, null);
  return { ...draft, first, second, late, moved: moved.id, out: out.id };
}

/** The members the draft holds for each of its groups, by group id. */
async function draftMembers(db: Database) {
  const draft = await testDraftOf(db, YEAR);
  const members = new Map<string, string[]>();
  for (const group of draft.groups) {
    members.set(group.id, group.members.map((member) => member.id).sort());
  }
  return members;
}

/** Who is in which group in force, by program studi and number. */
async function liveMembers(db: Database) {
  const groups = await testLiveGroupsOf(db, YEAR);
  const members = new Map<string, string[]>();
  for (const group of groups) {
    if (group.endedAt !== null) continue;
    members.set(`${group.studyProgramId}-${group.number}`, group.studentIds);
  }
  return members;
}

describe("cancelAssignment after students were placed on Pengguna baru mahasiswa", () => {
  it("leaves a draft that holds each group with the members it had at that moment", async () => {
    await inTestDatabase(async (db) => {
      const changed = await addChangedSinceFixed(db);
      const before = await draftMembers(db);

      const cancelled = await cancelAssignment(db, changed.head, KEY);

      expect(cancelled).toEqual({ ok: true, value: null });
      expect(await testDraftOf(db, YEAR)).toMatchObject({
        status: "cancelled",
      });
      const after = await draftMembers(db);
      expect(after).toEqual(before);
      expect(after.get(changed.first.id)).toHaveLength(29);
      expect(after.get(changed.first.id)).toContain(changed.late);
      expect(after.get(changed.second.id)).toHaveLength(31);
      expect(after.get(changed.second.id)).toContain(changed.moved);
      const placed = [...after.values()].flat();
      expect(placed).not.toContain(changed.out);
    });
  });

  it("writes into the draft the same members it keeps for the ended groups", async () => {
    await inTestDatabase(async (db) => {
      const changed = await addChangedSinceFixed(db);
      const liveOfFirst = await testLiveIdOf(db, changed.first.id);
      const liveOfSecond = await testLiveIdOf(db, changed.second.id);

      await cancelAssignment(db, changed.head, KEY);

      const ended = await testLiveGroupsOf(db, YEAR);
      const past = (liveId: string) =>
        ended.find((group) => group.id === liveId)?.pastStudentIds;
      const draft = await draftMembers(db);
      expect(draft.get(changed.first.id)).toEqual(past(liveOfFirst));
      expect(draft.get(changed.second.id)).toEqual(past(liveOfSecond));
    });
  });

  it("puts every student in the same group when it is fixed again without a change", async () => {
    await inTestDatabase(async (db) => {
      const changed = await addChangedSinceFixed(db);
      // The student who was taken out waits for a group, and a draft that
      // leaves a waiting student out is not fixed: they left the angkatan.
      await db
        .update(students)
        .set({ status: "inactive" })
        .where(eq(students.id, changed.out));
      const before = await liveMembers(db);
      await cancelAssignment(db, changed.head, KEY);
      expect(await liveMembers(db)).toEqual(new Map());

      const fixed = await fixAssignment(db, changed.head, {
        cohortYear: YEAR,
        version: 4,
        decreeNumber: "KEP-UJITETAP",
        effectiveOn: "2068-09-01",
      });

      expect(fixed).toEqual({ ok: true, value: null });
      const after = await liveMembers(db);
      expect(after).toEqual(before);
      expect([...after.values()].flat()).toHaveLength(80);
      expect(await readWaitingStudents(db, EVERY_ROW, YEAR)).toEqual([]);
    });
  });

  it("takes a member who is on Cuti out of the draft, with its line in the log", async () => {
    await inTestDatabase(async (db) => {
      const changed = await addChangedSinceFixed(db);
      await db
        .update(students)
        .set({ status: "on_leave" })
        .where(eq(students.id, changed.late));

      await cancelAssignment(db, changed.head, KEY);

      const draft = await testDraftOf(db, YEAR);
      const kept = await db
        .select()
        .from(cohortAssignmentMembers)
        .where(eq(cohortAssignmentMembers.studentId, changed.late));
      expect(kept).toEqual([]);
      expect(draft.dropped).toBe(0);
      expect(draft.log.map((line) => line.action)).toContain("members_dropped");
    });
  });

  it("keeps a member in the group they were in when the draft of another angkatan still names them", async () => {
    await inTestDatabase(async (db) => {
      const changed = await addChangedSinceFixed(db);
      const other = await addTestDraft(
        db,
        OTHER_YEAR,
        OTHER_FIRST_NIM,
        "UJITETAP2",
      );
      const [otherGroup] = await testGroupsOf(db, OTHER_YEAR, other.large);
      if (!otherGroup) throw new Error("The other draft has no group.");
      await db
        .insert(cohortAssignmentMembers)
        .values({ studentId: changed.late, groupId: otherGroup.id });

      const cancelled = await cancelAssignment(db, changed.head, KEY);

      expect(cancelled).toEqual({ ok: true, value: null });
      const draft = await draftMembers(db);
      expect(draft.get(changed.first.id)).toContain(changed.late);
      const [stillThere] = await testGroupsOf(db, OTHER_YEAR, other.large);
      expect(stillThere?.members).toHaveLength(30);
    });
  });
});
